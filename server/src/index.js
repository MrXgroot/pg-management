import { app } from "./app.js";
import { getDatabase } from "../db/connection.js";

const PORT = process.env.PORT || 4000;

// Ensure database connection and pragmas (WAL mode, foreign keys) initialize before listening
try {
  const db = getDatabase();
  console.log("Database connection initialized successfully.");
} catch (err) {
  console.error("Failed to initialize database connection:", err);
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`Stay Ledger V1 server running on http://localhost:${PORT}`);
});

// Graceful shutdown handling
function handleShutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed.");
    try {
      const db = getDatabase();
      db.close();
      console.log("Database connection closed.");
    } catch {
      // Database might already be closed
    }
    process.exit(0);
  });
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
