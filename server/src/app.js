import express from "express";
import cors from "cors";
import { propertyRouter } from "./routes/propertyRoutes.js";
import { tenantRouter } from "./routes/tenantRoutes.js";
import { paymentRouter } from "./routes/paymentRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${req.method}] ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
    );
  });
  next();
});

// Mounted API routes under /api/v1
app.use("/api/v1", propertyRouter);
app.use("/api/v1", tenantRouter);
app.use("/api/v1", paymentRouter);

// 404 Catch-All Route Handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}`,
      details: null,
    },
  });
});

// Centralized error handler
app.use(errorHandler);
