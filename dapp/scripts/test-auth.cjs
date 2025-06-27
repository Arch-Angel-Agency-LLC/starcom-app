#!/usr/bin/env node
/**
 * Authentication Test Runner
 * 
 * This script runs all authentication tests and provides a comprehensive
 * report on the authentication system functionality.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Starcom MK2 Authentication Test Runner');
console.log('==========================================\n');

// Function to run tests with proper error handling
function runTests() {
  try {
    console.log('📋 Running Authentication Unit Tests...');
    
    // Run the unit tests
    const testCommand = 'npx vitest run src/testing/auth-unit.test.ts --reporter=verbose';
    
    console.log('Executing:', testCommand);
    console.log('');
    
    const output = execSync(testCommand, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    console.log('✅ Unit tests completed successfully!');
    
    return true;
  } catch (error) {
    console.error('❌ Unit tests failed:');
    console.error(error.stdout || error.message);
    return false;
  }
}

// Function to check TypeScript compilation
function checkTypeScript() {
  try {
    console.log('🔧 Checking TypeScript compilation...');
    
    execSync('npx tsc --noEmit --skipLibCheck', {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    console.log('✅ TypeScript compilation successful');
    return true;
  } catch (error) {
    console.error('❌ TypeScript compilation failed:');
    console.error(error.stdout?.toString() || error.message);
    return false;
  }
}

// Function to run build test
function testBuild() {
  try {
    console.log('🏗️ Testing build process...');
    
    execSync('npm run build', {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    console.log('✅ Build process successful');
    return true;
  } catch (error) {
    console.error('❌ Build process failed:');
    console.error(error.stdout?.toString() || error.message);
    return false;
  }
}

// Main test execution
async function main() {
  console.log('🚀 Starting Comprehensive Authentication Test Suite\n');
  
  const results = {
    typescript: false,
    unitTests: false,
    build: false,
  };
  
  // Check TypeScript first
  results.typescript = checkTypeScript();
  console.log('');
  
  // Run unit tests
  if (results.typescript) {
    results.unitTests = runTests();
    console.log('');
  } else {
    console.log('⏭️ Skipping unit tests due to TypeScript errors\n');
  }
  
  // Test build
  if (results.typescript && results.unitTests) {
    results.build = testBuild();
    console.log('');
  } else {
    console.log('⏭️ Skipping build test due to previous failures\n');
  }
  
  // Generate report
  console.log('📊 Test Results Summary:');
  console.log('========================');
  console.log(`TypeScript:  ${results.typescript ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Unit Tests:  ${results.unitTests ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Build Test:  ${results.build ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  console.log('');
  if (allPassed) {
    console.log('🎉 ALL AUTHENTICATION TESTS PASSED!');
    console.log('');
    console.log('✅ Authentication system is fully functional');
    console.log('✅ All TypeScript types are correct');
    console.log('✅ All unit tests pass');
    console.log('✅ Build process works correctly');
    console.log('');
    console.log('🚀 Authentication system is ready for use!');
    
    // Additional test instructions
    console.log('');
    console.log('📝 Additional Testing Options:');
    console.log('==============================');
    console.log('1. Interactive testing:');
    console.log('   - Import and run: src/testing/auth-interactive-test.ts');
    console.log('   - Use: createAuthTest().runAllTests()');
    console.log('');
    console.log('2. Browser testing:');
    console.log('   - Open browser console');
    console.log('   - Run: window.runQuickAuthTest()');
    console.log('');
    console.log('3. Manual hook testing:');
    console.log('   - Use React dev tools');
    console.log('   - Test individual hooks in components');
    
  } else {
    console.log('⚠️ SOME TESTS FAILED');
    console.log('');
    console.log('Please review the errors above and fix them before proceeding.');
    
    if (!results.typescript) {
      console.log('🔧 Fix TypeScript errors first');
    }
    if (!results.unitTests) {
      console.log('🧪 Fix unit test failures');
    }
    if (!results.build) {
      console.log('🏗️ Fix build issues');
    }
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
main().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
