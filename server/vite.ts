import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: any) {
  try {
    // Only import Vite modules when this function is actually called (in development)
    const { createServer: createViteServer, createLogger } = await import("vite");
    const viteConfig = (await import("../vite.config")).default;
    const { nanoid } = await import("nanoid");

    const viteLogger = createLogger();

    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as const,
    };

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          process.exit(1);
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html",
        );

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (error) {
    console.error("Failed to setup Vite:", error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  try {
    const distPath = path.resolve(import.meta.dirname, "public");

    // Check if the dist/public directory exists
    if (fs.existsSync(distPath)) {
      // Serve static files if they exist
      app.use(express.static(distPath));

      // Fall through to index.html if the file doesn't exist
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      // If no frontend build exists, serve a simple API response
      app.use("*", (_req, res) => {
        res.status(200).json({ 
          message: "Spark Salon WhatsApp Bot API Server", 
          status: "running",
          timestamp: new Date().toISOString()
        });
      });
    }
  } catch (error) {
    console.error("Failed to serve static files:", error);
    // Fallback to simple API response
    app.use("*", (_req, res) => {
      res.status(200).json({ 
        message: "Spark Salon WhatsApp Bot API Server", 
        status: "running",
        timestamp: new Date().toISOString()
      });
    });
  }
}