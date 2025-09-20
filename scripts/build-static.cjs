const fs = require('fs');
const path = require('path');

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy dist/public to public
const distPublicDir = path.join(__dirname, '..', 'dist', 'public');
if (fs.existsSync(distPublicDir)) {
  // Function to copy directory recursively
  function copyDir(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    fs.mkdirSync(dest, { recursive: true });
    for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyDir(distPublicDir, publicDir);
  console.log('Static files copied to public directory');
} else {
  console.error('dist/public directory not found');
}