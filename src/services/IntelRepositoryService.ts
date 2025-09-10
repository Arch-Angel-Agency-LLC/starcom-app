/**
 * IntelRepositoryService - Git Integration Implementation
 * 
 * Implements the IntelRepository interface for Git-based version control
 * of Intel files (.intel, .intelReport, .intelReportPackage)
 * 
 * Key Features:
 * - Git wrapper for Intel file operations
 * - Intel-specific version control workflows
 * - Collaboration features for multi-user Intel development
 * - Conflict resolution for Intel file merging
 * - Commit history tracking for Intel objects
 */

// Restored repository type definitions (previously lost during refactor attempt)
interface GitConfig {
  user: { name: string; email: string };
  remote: { name: string; url: string };
  defaultBranch: string;
}

interface BranchInfo {
  name: string;
  hash: string;
  isActive: boolean;
  upstream: string | null;
  lastCommit: Date;
}

interface RepositoryInfo {
  path: string;
  initialized: boolean;
  currentBranch: string;
  remoteUrl: string;
  status: string; // e.g. 'clean' | 'dirty'
}

interface CommitHistory {
  hash: string;
  message: string;
  author: string;
  timestamp: Date;
  filesChanged: string[];
}

interface CommitResult {
  hash: string;
  message: string;
  timestamp: Date;
  author: string;
  filesChanged?: string[];
}

interface MergeResult {
  success: boolean;
  conflicts: string[];
  mergeCommit: string | null;
  message: string;
}

interface ConflictResolution {
  resolvedFiles: string[];
  errors: string[];
  success: boolean;
}

interface ReviewComment {
  author: string;
  comment: string;
  timestamp: Date;
}

interface ReviewRequest {
  id: string;
  intelId: string;
  reviewers: string[];
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'changes-requested';
  branch: string;
  comments: ReviewComment[];
}

interface ComparisonResult {
  intelId: string;
  version1: { hash: string; content: string };
  version2: { hash: string; content: string };
  differences: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

interface RepositoryStatus {
  currentBranch: string;
  branches: BranchInfo[];
  modifiedFiles: { path: string; status: string }[];
  hasUncommittedChanges: boolean;
  ahead: number;
  behind: number;
}

interface Intel {
  id: string;
  title: string;
  type: string;
  content?: string;
  metadata: {
    created: Date;
    lastModified: Date;
  };
}

interface RepoIntelReport {
  id: string;
  title: string;
  content: Record<string, unknown>;
}

interface IntelWorkspace {
  path: string;
  name: string;
  type: string;
  metadata: {
    created: Date;
    lastModified: Date;
    version: string;
  };
  structure: {
    intelFiles: string[];
    reportFiles: string[];
    packageFolders: string[];
  };
}

/**
 * Git-based repository service for Intel version control
 */
export class IntelRepositoryService {
  protected workspacePath: string;
  protected gitConfig: GitConfig;
  protected initialized: boolean = false;
  // Lightweight dependency injection seam to enable unit testing without subclassing.
  // Phase 4 Test Enablement: allows injecting mock file writer & git executor so
  // canonical serialization can be validated in isolation (previous test attempts
  // failed due to subclass + TS transform friction in mixed environments).
  private fileWriter?: (path: string, content: string) => Promise<void> | void;
  private fileReader?: (path: string) => Promise<string> | string;
  private gitExec?: (args: string[]) => Promise<string> | string;

  constructor(
    workspacePath: string,
    gitConfig?: GitConfig,
    deps?: {
      fileWriter?: (path: string, content: string) => Promise<void> | void;
      fileReader?: (path: string) => Promise<string> | string;
      gitExec?: (args: string[]) => Promise<string> | string;
    }
  ) {
    this.workspacePath = workspacePath;
    this.gitConfig = gitConfig || {
      user: { name: 'Intel User', email: 'intel@starcom.app' },
      remote: { name: 'origin', url: '' },
      defaultBranch: 'main'
    };
  this.fileWriter = deps?.fileWriter;
  this.fileReader = deps?.fileReader;
    this.gitExec = deps?.gitExec;
  }

  // Phase 3 alignment: route UI-level Intel CRUD via centralized intelReportService
  // This keeps repository-specific logic separate while standardizing data flow.
  // Consumers should prefer intelReportService directly for typical app workflows.
  async listUIReports(): Promise<import('../types/intel/IntelReportUI').IntelReportUI[]> {
    const { intelReportService } = await import('./intel/IntelReportService');
    return intelReportService.listReports();
  }

  async getUIReport(id: string): Promise<import('../types/intel/IntelReportUI').IntelReportUI | null> {
    const { intelReportService } = await import('./intel/IntelReportService');
    return intelReportService.getReport(id);
  }

  async createUIReport(input: import('../types/intel/IntelReportUI').CreateIntelReportInput, author: string) {
    const { intelReportService } = await import('./intel/IntelReportService');
    return intelReportService.createReport(input, author);
  }

  async saveUIReport(report: import('../types/intel/IntelReportUI').IntelReportUI) {
    const { intelReportService } = await import('./intel/IntelReportService');
    return intelReportService.saveReport(report);
  }

  /**
   * Initialize Git repository in workspace
   */
  async initRepository(): Promise<RepositoryInfo> {
    try {
      // Initialize Git repository
      await this.execGit(['init']);
      
      // Set up Git configuration
      await this.execGit(['config', 'user.name', this.gitConfig.user.name]);
      await this.execGit(['config', 'user.email', this.gitConfig.user.email]);
      
      // Create initial .gitignore for Intel files
      const gitignoreContent = `
# Intel System Files
*.tmp
*.cache
*.log

# Node modules
node_modules/

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db
`;
      
      await this.writeFile('.gitignore', gitignoreContent);
      
      // Create initial commit
      await this.execGit(['add', '.gitignore']);
      await this.execGit(['commit', '-m', 'Initial Intel repository setup']);
      
      this.initialized = true;
      
      return {
        path: this.workspacePath,
        initialized: true,
        currentBranch: this.gitConfig.defaultBranch,
        remoteUrl: this.gitConfig.remote.url,
        status: 'clean'
      };
    } catch (error) {
      throw new Error(`Failed to initialize repository: ${error.message}`);
    }
  }

  /**
   * Clone existing Intel repository
   */
  async cloneRepository(url: string, localPath: string): Promise<IntelWorkspace> {
    try {
      await this.execGit(['clone', url, localPath]);
      
      // Verify this is an Intel workspace
      const hasIntelFiles = await this.hasIntelFiles(localPath);
      if (!hasIntelFiles) {
        throw new Error('Cloned repository does not contain Intel files');
      }

      return {
        path: localPath,
        name: this.extractRepoName(url),
        type: 'git-workspace',
        metadata: {
          created: new Date(),
          lastModified: new Date(),
          version: '1.0.0'
        },
        structure: await this.analyzeWorkspaceStructure(localPath)
      };
    } catch (error) {
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  /**
   * Commit changes to repository
   */
  async commitChanges(message: string, files?: string[]): Promise<CommitResult> {
    this.ensureInitialized();
    
    try {
      // Add files (all if not specified)
      if (files && files.length > 0) {
        await this.execGit(['add', ...files]);
      } else {
        await this.execGit(['add', '.']);
      }
      
      // Check if there are changes to commit
      const status = await this.execGit(['status', '--porcelain']);
      if (!status.trim()) {
        return {
          hash: '',
          message: 'No changes to commit',
          timestamp: new Date(),
          author: this.gitConfig.user.name,
          filesChanged: []
        };
      }
      
      // Commit changes
      await this.execGit(['commit', '-m', message]);
      
      // Get commit hash
      const hash = await this.execGit(['rev-parse', 'HEAD']);
      
      // Get changed files
      const changedFiles = await this.getChangedFiles();
      
      return {
        hash: hash.trim(),
        message,
        timestamp: new Date(),
        author: this.gitConfig.user.name,
        filesChanged: changedFiles
      };
    } catch (error) {
      throw new Error(`Failed to commit changes: ${error.message}`);
    }
  }

  /**
   * Push changes to remote repository
   */
  async pushChanges(remote: string = 'origin', branch?: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      const currentBranch = branch || await this.getCurrentBranch();
      await this.execGit(['push', remote, currentBranch]);
    } catch (error) {
      throw new Error(`Failed to push changes: ${error.message}`);
    }
  }

  /**
   * Pull changes from remote repository
   */
  async pullChanges(remote: string = 'origin', branch?: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      const currentBranch = branch || await this.getCurrentBranch();
      await this.execGit(['pull', remote, currentBranch]);
    } catch (error) {
      throw new Error(`Failed to pull changes: ${error.message}`);
    }
  }

  /**
   * Save Intel and commit in one operation
   */
  async saveAndCommitIntel(intel: Intel, message?: string): Promise<CommitResult> {
    this.ensureInitialized();
    
    try {
      // Save Intel to file
      const intelPath = `intel/${intel.id}.intel`;
      await this.saveIntelToFile(intel, intelPath);
      
      // Commit the Intel file
      const commitMessage = message || `Add/Update Intel: ${intel.title}`;
      return await this.commitChanges(commitMessage, [intelPath]);
    } catch (error) {
      throw new Error(`Failed to save and commit Intel: ${error.message}`);
    }
  }

  /**
   * Save Intel Report and commit in one operation
   */
  async saveAndCommitReport(report: RepoIntelReport, message?: string): Promise<CommitResult> {
    this.ensureInitialized();
    
    try {
      // Phase 4 migration: prefer canonical serializer for UI reports; fall back to legacy only if needed.
      // If the incoming shape is a legacy RepoIntelReport, attempt to map minimally to canonical UI-like shape.
      const { parseReport } = await import('./intel/serialization/intelReportSerialization');
      // Try to parse if it's already canonical-like; otherwise wrap minimally.
      const candidate = report as unknown as Record<string, unknown> | null;
      const isAlreadyCanonical = !!(candidate && candidate['schema'] === 'intel.report' && candidate['schemaVersion'] === 1);
      const maybeCanonical = isAlreadyCanonical
        ? candidate
        : {
            schema: 'intel.report',
            schemaVersion: 1,
            id: report.id,
            title: report.title,
            // Required canonical fields with safe defaults
            author: (candidate && typeof candidate['author'] === 'string' ? String(candidate['author']) : 'unknown'),
            category: (candidate && typeof candidate['category'] === 'string' ? String(candidate['category']) : 'GENERAL'),
            tags: (candidate && Array.isArray(candidate['tags']) ? (candidate['tags'] as unknown[]) : []),
            classification: (candidate && typeof candidate['classification'] === 'string' ? String(candidate['classification']) : 'UNCLASSIFIED'),
            status: (candidate && typeof candidate['status'] === 'string' ? String(candidate['status']) : 'DRAFT'),
            createdAt: (candidate && typeof candidate['createdAt'] === 'string' ? String(candidate['createdAt']) : new Date().toISOString()),
            updatedAt: new Date().toISOString(),
            content:
              (typeof (report as unknown as { content?: unknown }).content === 'string')
                ? (report as unknown as { content: string }).content
                : JSON.stringify((report as unknown as { content?: unknown }).content || {}),
            // Optional/carry-over fields when present
            summary: (candidate && typeof candidate['summary'] === 'string' ? String(candidate['summary']) : undefined),
            priority: (candidate && typeof candidate['priority'] === 'string' ? String(candidate['priority']) : undefined),
            history: (candidate && Array.isArray(candidate['history']) ? (candidate['history'] as unknown[]) : [])
          };
      const { report: ui, errors } = parseReport(maybeCanonical as unknown);
      if (ui && errors.length === 0) {
        // Save via canonical serializer path
        const res = await this.saveCanonicalUIReport(ui, message || `Add/Update Report: ${ui.title}`);
        // saveCanonicalUIReport may return void if repo not initialized; ensure commit result
        if (res) return res;
        // Fallback commit (should not generally happen because save handles commit when initialized)
        return this.commitChanges(message || `Add/Update Report: ${ui.title}`, [`reports/${ui.id}.intelReport`]);
      }
      // If parsing failed, use legacy raw JSON as last resort
      const reportPath = `reports/${report.id}.intelReport`;
      await this.saveReportToFile(report, reportPath);
      const commitMessage = message || `Add/Update Report: ${report.title}`;
      return await this.commitChanges(commitMessage, [reportPath]);
    } catch (error) {
      throw new Error(`Failed to save and commit Report: ${error.message}`);
    }
  }

  /**
   * Load Intel from specific commit
   */
  async loadIntelFromCommit(commitHash: string, intelId: string): Promise<Intel | null> {
    this.ensureInitialized();
    
    try {
    const pathAtCommit = `intel/${intelId}.intel`;
    const fileContent = await this.execGit(['show', `${commitHash}:${pathAtCommit}`]);
      return this.parseIntelFile(fileContent);
    } catch (_error) {
      // File might not exist in that commit
      return null;
    }
  }

  /**
   * Get commit history for specific Intel
   */
  async getIntelHistory(intelId: string): Promise<CommitHistory[]> {
    this.ensureInitialized();
    
    try {
          const pathAtCommit = `intel/${intelId}.intel`;
          const logOutput = await this.execGit([
            'log', 
            '--format=%H|%s|%an|%ad', 
            '--date=iso',
            '--', 
            pathAtCommit
          ]);
      
      return logOutput.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, message, author, date] = line.split('|');
          return {
            hash,
            message,
            author,
            timestamp: new Date(date),
                       filesChanged: [pathAtCommit]
          };
        });
    } catch (error) {
      throw new Error(`Failed to get Intel history: ${error.message}`);
    }
  }

  /**
   * Create new branch
   */
  async createBranch(branchName: string, fromCommit?: string): Promise<BranchInfo> {
    this.ensureInitialized();
    
    try {
      if (fromCommit) {
        await this.execGit(['checkout', '-b', branchName, fromCommit]);
      } else {
        await this.execGit(['checkout', '-b', branchName]);
      }
      
      return {
        name: branchName,
        hash: await this.execGit(['rev-parse', 'HEAD']),
        isActive: true,
        upstream: null,
        lastCommit: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  /**
   * Merge Intel changes between branches
   */
  async mergeIntelChanges(sourceBranch: string, targetBranch: string): Promise<MergeResult> {
    this.ensureInitialized();
    
    try {
      // Switch to target branch
      await this.execGit(['checkout', targetBranch]);
      
      // Attempt merge
      try {
        await this.execGit(['merge', sourceBranch]);
        
        return {
          success: true,
          conflicts: [],
          mergeCommit: await this.execGit(['rev-parse', 'HEAD']),
          message: `Successfully merged ${sourceBranch} into ${targetBranch}`
        };
      } catch (_mergeError) {
        // Check for conflicts
        const conflicts = await this.getConflictedFiles();
        
        return {
          success: false,
          conflicts,
          mergeCommit: null,
          message: `Merge conflicts detected in ${conflicts.length} files`
        };
      }
    } catch (error) {
      throw new Error(`Failed to merge Intel changes: ${error.message}`);
    }
  }

  /**
   * Resolve Intel file conflicts
   */
  async resolveIntelConflicts(conflictedFiles: string[]): Promise<ConflictResolution> {
    this.ensureInitialized();
    
    try {
      const resolvedFiles: string[] = [];
      const errors: string[] = [];
      
      for (const filePath of conflictedFiles) {
        try {
          if (filePath.endsWith('.intel') || filePath.endsWith('.intelReport')) {
            await this.resolveIntelFileConflict(filePath);
            resolvedFiles.push(filePath);
          } else {
            // For non-Intel files, mark as resolved (manual intervention needed)
            await this.execGit(['add', filePath]);
            resolvedFiles.push(filePath);
          }
        } catch (error) {
          errors.push(`Failed to resolve ${filePath}: ${error.message}`);
        }
      }
      
      return {
        resolvedFiles,
        errors,
        success: errors.length === 0
      };
    } catch (error) {
      throw new Error(`Failed to resolve conflicts: ${error.message}`);
    }
  }

  /**
   * Get repository status
   */
  async getStatus(): Promise<RepositoryStatus> {
    this.ensureInitialized();
    
    try {
      const statusOutput = await this.execGit(['status', '--porcelain']);
      const currentBranch = await this.getCurrentBranch();
      const branches = await this.getBranches();
      
      const modifiedFiles = statusOutput.split('\n')
        .filter(line => line.trim())
        .map(line => ({
          path: line.substring(3),
          status: this.parseFileStatus(line.substring(0, 2))
        }));
      
      return {
        currentBranch,
        branches,
        modifiedFiles,
        hasUncommittedChanges: modifiedFiles.length > 0,
        ahead: 0, // Would need to implement remote tracking
        behind: 0
      };
    } catch (error) {
      throw new Error(`Failed to get repository status: ${error.message}`);
    }
  }

  // Protected helper methods accessible to subclasses

  protected async execGit(args: string[]): Promise<string> {
    if (this.gitExec) {
      const result = await this.gitExec(args);
      return typeof result === 'string' ? result : '';
    }
    // Default mock implementation (no real git side-effects)
    const command = `git ${args.join(' ')}`;
    console.log(`Executing: ${command}`);
    if (args[0] === 'init') return '';
    if (args[0] === 'config') return '';
    if (args[0] === 'add') return '';
    if (args[0] === 'commit') return '';
    if (args[0] === 'rev-parse' && args[1] === 'HEAD') return 'abc123def456';
    if (args[0] === 'status') return '';
    if (args[0] === 'branch') return 'main';
    if (args[0] === 'diff') return '';
    return '';
  }

  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Repository not initialized. Call initRepository() first.');
    }
  }

  protected async writeFile(_path: string, _content: string): Promise<void> {
    if (this.fileWriter) {
      await this.fileWriter(_path, _content);
      return;
    }
    // Default mock: log only
    console.log(`Writing file: ${_path}`);
  }

  protected async readFile(_path: string): Promise<string> {
    if (this.fileReader) {
      const result = await this.fileReader(_path);
      return typeof result === 'string' ? result : '';
    }
    // Default mock: nothing to read
    console.log(`Reading file (mock, empty): ${_path}`);
    return '';
  }

  protected async hasIntelFiles(_path: string): Promise<boolean> {
    // Check if directory contains .intel or .intelReport files
    return true; // Mock implementation
  }

  protected extractRepoName(url: string): string {
    return url.split('/').pop()?.replace('.git', '') || 'unknown';
  }

  protected async analyzeWorkspaceStructure(_path: string): Promise<{
    intelFiles: string[];
    reportFiles: string[];
    packageFolders: string[];
  }> {
    // Analyze and return workspace structure
    return {
      intelFiles: [],
      reportFiles: [],
      packageFolders: []
    };
  }

  protected async getCurrentBranch(): Promise<string> {
    return await this.execGit(['branch', '--show-current']);
  }

  protected async getChangedFiles(): Promise<string[]> {
    const output = await this.execGit(['diff', '--name-only', 'HEAD~1']);
    return output.split('\n').filter(line => line.trim());
  }

  protected async getBranches(): Promise<BranchInfo[]> {
    const output = await this.execGit(['branch', '-v']);
    return output.split('\n')
      .filter(line => line.trim())
      .map(line => ({
        name: line.substring(2).split(' ')[0],
        hash: line.split(' ')[1],
        isActive: line.startsWith('*'),
        upstream: null,
        lastCommit: new Date()
      }));
  }

  protected async getConflictedFiles(): Promise<string[]> {
    const output = await this.execGit(['diff', '--name-only', '--diff-filter=U']);
    return output.split('\n').filter(line => line.trim());
  }

  protected async resolveIntelFileConflict(filePath: string): Promise<void> {
    // Implement Intel-specific conflict resolution logic
    // This would parse the conflict markers and attempt intelligent merging
    console.log(`Resolving Intel file conflict: ${filePath}`);
    
    // For now, just mark as resolved
    await this.execGit(['add', filePath]);
  }

  protected parseFileStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'M ': 'modified',
      'A ': 'added',
      'D ': 'deleted',
      'R ': 'renamed',
      'C ': 'copied',
      'U ': 'unmerged',
      '??': 'untracked'
    };
    return statusMap[status] || 'unknown';
  }

  protected async saveIntelToFile(intel: Intel, path: string): Promise<void> {
    // Convert Intel object to .intel file format (markdown + frontmatter)
    const frontmatter = `---
id: ${intel.id}
title: ${intel.title}
type: ${intel.type}
created: ${intel.metadata.created.toISOString()}
modified: ${intel.metadata.lastModified.toISOString()}
---

`;
    const content = frontmatter + (intel.content || '');
    await this.writeFile(path, content);
  }

  protected async saveReportToFile(report: RepoIntelReport, path: string): Promise<void> {
    // Legacy raw .intelReport persistence path (deprecated).
    // Prefer saveCanonicalUIReport; this remains for backwards compatibility during Phase 4.
    const content = JSON.stringify(report, null, 2);
    await this.writeFile(path, content);
  }

  protected parseIntelFile(_content: string): Intel | null {
    // Parse .intel file format back to Intel object
    // This would implement the reverse of saveIntelToFile
    return null; // Mock implementation
  }

  /**
   * Phase 4 incremental: persist a canonical IntelReportUI using schema v1 serialization
   * without altering existing legacy RepoIntelReport persistence. This allows
   * gradual migration of repository storage to single-source serialization.
   *
   * Behavior:
   *  - Serializes using serializeReport (intelReportSerialization)
   *  - Writes JSON to reports/{id}.intelReport
   *  - Optionally commits immediately if repository initialized
   */
  async saveCanonicalUIReport(report: import('../types/intel/IntelReportUI').IntelReportUI, commitMessage?: string): Promise<CommitResult | void> {
    const path = `reports/${report.id}.intelReport`;
    const { serializeReport } = await import('./intel/serialization/intelReportSerialization');
    const serialized = serializeReport(report);
    await this.writeFile(path, JSON.stringify(serialized, null, 2));
    if (this.initialized) {
      return this.commitChanges(commitMessage || `Add/Update Canonical Report: ${report.title}`, [path]);
    }
  }

  /**
   * Load and parse a canonical IntelReportUI from repository storage using schema v1.
   * Returns parse warnings/errors alongside the report (if valid).
   */
  async loadCanonicalUIReport(id: string): Promise<{ report?: import('../types/intel/IntelReportUI').IntelReportUI; warnings: string[]; errors: string[] }>{
    const path = `reports/${id}.intelReport`;
    const raw = await this.readFile(path);
    try {
      const obj = raw ? JSON.parse(raw) : null;
      const { parseReport } = await import('./intel/serialization/intelReportSerialization');
      return parseReport(obj as unknown);
    } catch (e) {
      return { warnings: [], errors: [e instanceof Error ? e.message : 'Parse error'] };
    }
  }
}

/**
 * Enhanced Git Repository for collaborative Intel workflows
 */
export class IntelCollaborationRepository extends IntelRepositoryService {
  
  /**
   * Request review for Intel changes
   */
  async requestReview(intelId: string, reviewers: string[]): Promise<ReviewRequest> {
    this.ensureInitialized();
    
    try {
  const _intelPath = `intel/${intelId}.intel`;
      
      // Create review branch
      const reviewBranch = `review/${intelId}-${Date.now()}`;
      await this.createBranch(reviewBranch);
      
      // Create review metadata
      const reviewRequest: ReviewRequest = {
        id: `review-${intelId}-${Date.now()}`,
        intelId,
        reviewers,
        requestedBy: this.gitConfig.user.name,
        requestedAt: new Date(),
        status: 'pending',
        branch: reviewBranch,
        comments: []
      };
      
      // Save review request metadata
      await this.writeFile(`reviews/${reviewRequest.id}.json`, JSON.stringify(reviewRequest, null, 2));
      await this.commitChanges(`Request review for Intel ${intelId}`, [`reviews/${reviewRequest.id}.json`]);
      
      return reviewRequest;
    } catch (error) {
      throw new Error(`Failed to request review: ${error.message}`);
    }
  }

  /**
   * Approve Intel changes
   */
  async approveIntel(intelId: string, reviewComment?: string): Promise<void> {
    // Implementation would update review status and merge changes
    console.log(`Approving Intel ${intelId} with comment: ${reviewComment || 'No comment'}`);
  }

  /**
   * Publish Intel to main branch
   */
  async publishIntel(intelId: string, targetBranch: string = 'main'): Promise<void> {
    // Implementation would merge approved changes to target branch
    console.log(`Publishing Intel ${intelId} to ${targetBranch}`);
  }

  /**
   * Cherry-pick Intel changes to another branch
   */
  async cherryPickIntel(intelId: string, targetBranch: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      // Find commits that modified this Intel
      const intelPath = `intel/${intelId}.intel`;
      const commits = await this.execGit(['log', '--format=%H', '--', intelPath]);
      
      if (!commits.trim()) {
        throw new Error(`No commits found for Intel ${intelId}`);
      }
      
      const latestCommit = commits.split('\n')[0];
      
      // Switch to target branch
      await this.execGit(['checkout', targetBranch]);
      
      // Cherry-pick the commit
      await this.execGit(['cherry-pick', latestCommit]);
    } catch (error) {
      throw new Error(`Failed to cherry-pick Intel: ${error.message}`);
    }
  }

  /**
   * Compare Intel versions between commits
   */
  async compareIntelVersions(intelId: string, version1: string, version2: string): Promise<ComparisonResult> {
    this.ensureInitialized();
    
    try {
      const intelPath = `intel/${intelId}.intel`;
      
      // Get content from both versions
      const content1 = await this.execGit(['show', `${version1}:${intelPath}`]);
      const content2 = await this.execGit(['show', `${version2}:${intelPath}`]);
      
      // Return comparison data
      return {
        intelId,
        version1: { hash: version1, content: content1 },
        version2: { hash: version2, content: content2 },
        differences: this.calculateDifferences(content1, content2)
      };
    } catch (error) {
      throw new Error(`Failed to compare Intel versions: ${(error as Error).message}`);
    }
  }

  private calculateDifferences(_content1: string, _content2: string): {
    added: string[];
    removed: string[];
    modified: string[];
  } {
    // Implementation would calculate detailed differences
    return {
      added: [],
      removed: [],
      modified: []
    };
  }
}

/**
 * Factory function to create IntelRepositoryService
 */
export function createIntelRepositoryService(workspacePath: string, gitConfig?: GitConfig): IntelRepositoryService {
  return new IntelRepositoryService(workspacePath, gitConfig);
}

/**
 * Factory function to create IntelCollaborationRepository
 */
export function createIntelCollaborationRepository(workspacePath: string, gitConfig?: GitConfig): IntelCollaborationRepository {
  return new IntelCollaborationRepository(workspacePath, gitConfig);
}
