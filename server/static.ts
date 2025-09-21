import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // In Vercel, the API is at /var/task/api/ but static files are at /var/task/dist/public/
  // In local build, both are relative to the same dist folder
  let distPath = path.resolve(import.meta.dirname, "public");
  
  // If we're in a Vercel environment (api folder), look for dist/public instead
  if (!fs.existsSync(distPath)) {
    distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  }

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

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
    
    // Serve index.html for all other routes (SPA routing)
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}