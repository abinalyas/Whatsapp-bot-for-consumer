import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Try multiple possible paths for static files
  const possiblePaths = [
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "..", "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve("/var/task/dist/public")
  ];
  
  let distPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      distPath = testPath;
      console.log(`Static files found at: ${distPath}`);
      break;
    }
  }
  
  if (!distPath) {
    throw new Error(
      `Could not find the build directory. Tried: ${possiblePaths.join(", ")}`
    );
  }

  // Serve static files with proper MIME types and cache headers
  app.use(express.static(distPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
      // Add cache-busting headers for assets
      if (path.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));

  // Debug endpoint to list available assets
  app.get('/debug/assets', (req, res) => {
    try {
      const assetsPath = path.join(distPath, 'assets');
      const files = fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : [];
      res.json({
        distPath,
        assetsPath,
        files,
        exists: fs.existsSync(assetsPath)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add specific route for assets to ensure they're served correctly
  app.get('/assets/*', (req, res, next) => {
    const assetPath = path.join(distPath, req.path);
    console.log(`Asset request: ${req.path} -> ${assetPath}`);
    
    if (fs.existsSync(assetPath)) {
      if (req.path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (req.path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.sendFile(assetPath);
    } else {
      console.log(`Asset not found: ${assetPath}`);
      res.status(404).send('Asset not found');
    }
  });

  // Only serve index.html for non-asset routes (SPA fallback)
  app.get("*", (req, res, next) => {
    // Don't serve index.html for asset requests
    if (req.path.startsWith('/assets/') || 
        req.path.endsWith('.js') || 
        req.path.endsWith('.css') || 
        req.path.endsWith('.ico') || 
        req.path.endsWith('.png') || 
        req.path.endsWith('.jpg') || 
        req.path.endsWith('.svg')) {
      return next();
    }
    
    console.log(`Serving index.html for route: ${req.path}`);
    // Serve index.html for all other routes (SPA routing)
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}