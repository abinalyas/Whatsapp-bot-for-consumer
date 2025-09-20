import express, { type Request, Response, NextFunction } from "express";

// Simple logger function
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware for API routes
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Health check route
app.get("/api/health", (_req, res) => {
  res.status(200).json({ 
    message: "Spark Salon WhatsApp Bot API Server", 
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// WhatsApp webhook verification (GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  
  if (mode === "subscribe" && token && challenge) {
    res.status(200).send(challenge);
    return;
  }
  
  res.status(403).json({ message: "Forbidden" });
});

// WhatsApp webhook handler (POST)
app.post("/webhook", (req, res) => {
  console.log("Webhook received:", JSON.stringify(req.body, null, 2));
  res.status(200).send("OK");
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
});

// Catch-all route for static response
app.use("*", (_req, res) => {
  res.status(200).json({ 
    message: "Spark Salon WhatsApp Bot API Server", 
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// Start server on Vercel-compatible port
const port = parseInt(process.env.PORT || '5000', 10);
app.listen(port, "localhost", () => {
  log(`serving on port ${port}`);
});