#!/usr/bin/env node

// Script to fix rollup optional dependencies issue on Vercel
const fs = require('fs');
const path = require('path');

try {
  // Try to fix the rollup issue by modifying its package.json
  const rollupPkgPath = path.join(__dirname, '..', 'node_modules', 'rollup', 'package.json');
  
  if (fs.existsSync(rollupPkgPath)) {
    const rollupPkg = JSON.parse(fs.readFileSync(rollupPkgPath, 'utf-8'));
    
    // Remove optional dependencies that cause issues
    delete rollupPkg.optionalDependencies;
    
    // Write back the modified package.json
    fs.writeFileSync(rollupPkgPath, JSON.stringify(rollupPkg, null, 2));
    console.log('Successfully fixed rollup package.json');
  } else {
    console.log('Rollup package.json not found, continuing with build');
  }
  
  // Run the normal build process
  const { execSync } = require('child_process');
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('Error fixing rollup or building:', error.message);
  console.log('Attempting to build server only...');
  
  // Try to build just the server as a fallback
  try {
    const { execSync } = require('child_process');
    execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  } catch (serverError) {
    console.error('Server build also failed:', serverError.message);
    process.exit(1);
  }
}