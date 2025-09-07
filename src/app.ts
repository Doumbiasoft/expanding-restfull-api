import express from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import router from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { OpenAPIGenerator } from "./utils/openapiGenerator";
import path from "path";
import "reflect-metadata";

const app = express();

/** Middlewares */
app.use(express.json());
app.use(cors());
app.use(compression());
app.use(morgan("dev"));

/** Routes */
app.use("/api/v1", router);

/** Initialize Dynamic OpenAPI Documentation */
async function setupApp() {
  // Setup OpenAPI endpoints with dynamic controller discovery
  await OpenAPIGenerator.setupEndpoints(app, {
    specPath: "/api-docs",
    docsPath: "/docs", // Scalar UI (modern, clean)
    swaggerPath: "/swagger", // Swagger UI (traditional, feature-rich)
    basePath: "/api/v1",
    controllersDir: path.join(__dirname, "controllers"),
    enableSwagger: true, // Enable Swagger UI
    enableScalar: true, // Enable Scalar UI
    info: {
      version: "1.0.0",
      title: "Expanding RestFull API",
      description:
        "This assignment will ask you to expand the example REST API application that was explored during the lesson, adding additional routes and features that are common with an API of its kind",
    },
  });

  // Global error handler (⚡ must be last)
  app.use(errorHandler);

  return app;
}

// Initialize the app
setupApp().catch(console.error);

export default app;
