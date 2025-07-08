#!/bin/bash

# NetRunner Test Script
# This script runs a set of tests to validate the NetRunner functionality

echo "====================================="
echo "NETRUNNER COMPONENT TESTING SUITE"
echo "====================================="

# Build the app
echo "Building the app..."
npm run build

# Start the development server
echo "Starting development server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 10

echo "====================================="
echo "Testing NetRunner Components..."
echo "====================================="

# Open the app in a browser
echo "Opening NetRunner dashboard in browser..."
open http://localhost:5173/netrunner

echo "Manual Testing Instructions:"
echo "1. Verify the NetRunner dashboard loads correctly"
echo "2. Test switching between different modes (Search, Power Tools, Bots, Analysis, Marketplace, Monitor)"
echo "3. Verify Power Tools panel displays the list of OSINT tools"
echo "4. Test Bot Control Panel functionality"
echo "5. Check Intel Report Builder form and functionality"
echo "6. Browse the Intelligence Exchange Marketplace"
echo "7. Test the Monitoring Dashboard interface"

# Wait for user to press Enter to kill server
echo "====================================="
echo "Press Enter when testing is complete to terminate the server..."
read

# Kill the server
echo "Terminating server..."
kill $SERVER_PID

echo "Test completed."
