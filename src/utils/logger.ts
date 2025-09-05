import { createLogger, format, transports } from "winston";
import { ENV } from "../config/env";

const { combine, timestamp, printf, colorize, errors } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}] : ${stack || message}`;
});

export const logger = createLogger({
  level: ENV.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    colorize(), // colors in dev
    timestamp(), // add timestamp
    errors({ stack: true }), // print stack trace for errors
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});
