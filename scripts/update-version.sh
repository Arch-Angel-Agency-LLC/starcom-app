#!/bin/bash

# Automated Version Tracking Script for Starcom App
# This script updates the version and deployment information

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function for colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if we're in a git repository
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    print_error "Not in a git repository. Please run from project root."
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('$PROJECT_ROOT/package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Version bump type (patch, minor, major)
BUMP_TYPE="${1:-patch}"

# Validate bump type
if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
    print_error "Invalid bump type: $BUMP_TYPE. Use: major, minor, or patch"
    exit 1
fi

print_status "Performing $BUMP_TYPE version bump..."

# Use npm to bump version
cd "$PROJECT_ROOT"
NEW_VERSION=$(npm version "$BUMP_TYPE" --no-git-tag-version 2>/dev/null)
NEW_VERSION=${NEW_VERSION#v}  # Remove 'v' prefix if present

print_success "Version bumped to: $NEW_VERSION"

# Update deployment date in utils/version.ts
VERSION_FILE="$PROJECT_ROOT/src/utils/version.ts"
CURRENT_DATE=$(date '+%Y-%m-%d')

if [ -f "$VERSION_FILE" ]; then
    # Update the deployment date in the version file
    sed -i.bak "s/deploymentDate: '[^']*'/deploymentDate: '$CURRENT_DATE'/" "$VERSION_FILE"
    
    # Clean up backup file
    rm -f "$VERSION_FILE.bak"
    
    print_success "Updated deployment date to: $CURRENT_DATE"
else
    print_warning "Version file not found at: $VERSION_FILE"
fi

# Check git status
if ! git diff --quiet; then
    print_status "Staging changes..."
    git add package.json
    
    if [ -f "$VERSION_FILE" ]; then
        git add "$VERSION_FILE"
    fi
    
    # Commit changes
    COMMIT_MSG="🚀 Release v$NEW_VERSION

- Version bump: $BUMP_TYPE
- Deployment date: $CURRENT_DATE
- Automated version tracking

#github-pull-request_copilot-coding-agent"
    
    git commit -m "$COMMIT_MSG"
    print_success "Committed version changes"
    
    # Create git tag
    git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION - $CURRENT_DATE"
    print_success "Created git tag: v$NEW_VERSION"
    
    # Show summary
    echo ""
    print_status "=== Release Summary ==="
    echo "Version: v$NEW_VERSION"
    echo "Date: $CURRENT_DATE"
    echo "Type: $BUMP_TYPE"
    echo "Commit: $(git rev-parse --short HEAD)"
    echo "Tag: v$NEW_VERSION"
    echo ""
    
    print_warning "Ready to push! Run the following commands:"
    echo "  git push origin main"
    echo "  git push origin v$NEW_VERSION"
    
else
    print_warning "No changes to commit. Version updated in package.json only."
fi

print_success "Version tracking completed successfully!"
