import "reflect-metadata";
import app from "./app";
import { ENV } from "./config/env";
import "colors";
import { logger } from "./utils/logger";

app.listen(ENV.PORT, () => {
  console.log(`\nExpanding RESTFull API`.bgGreen.white.bold);
  console.log(
    `🚀 Server running in ${ENV.NODE_ENV.green} mode on port ${
      ENV.PORT.toString().cyan
    }`.yellow
  );
  console.log(`⚡️ ${ENV.API_BASE_URL}:${ENV.PORT.toString().cyan}`.red);
  console.log("📚 API Docs:".bold);
  console.log(
    "   Scalar UI:".bold,
    `⚡️ ${ENV.API_BASE_URL}:${ENV.PORT.toString().cyan}/docs`.green
  );
  console.log(
    "   Swagger UI:".bold,
    `⚡️ ${ENV.API_BASE_URL}:${ENV.PORT.toString().cyan}/swagger`.green
  );
  console.log(
    `----------------------------------------------------------------`.red
  );
});
