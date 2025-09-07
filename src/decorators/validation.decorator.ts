import { Request, Response, NextFunction, RequestHandler } from "express";
import { sendError } from "../utils/response";
import { HttpStatus } from "../types/httpStatus";

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "object" | "array";
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationOptions {
  rules: ValidationRule[];
  allowUnknown?: boolean;
}

function validateValue(value: any, rule: ValidationRule): string | null {
  // Check if required
  if (
    rule.required &&
    (value === undefined || value === null || value === "")
  ) {
    return `Field '${rule.field}' is required`;
  }

  // If not required and empty, skip other validations
  if (
    !rule.required &&
    (value === undefined || value === null || value === "")
  ) {
    return null;
  }

  // Type validation
  if (rule.type) {
    const actualType = Array.isArray(value) ? "array" : typeof value;
    if (actualType !== rule.type) {
      return `Field '${rule.field}' must be of type ${rule.type}, got ${actualType}`;
    }
  }

  // String validations
  if (typeof value === "string") {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      return `Field '${rule.field}' must be at least ${rule.minLength} characters long`;
    }
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      return `Field '${rule.field}' must be at most ${rule.maxLength} characters long`;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      return `Field '${rule.field}' format is invalid`;
    }
  }

  // Number validations
  if (typeof value === "number") {
    if (rule.min !== undefined && value < rule.min) {
      return `Field '${rule.field}' must be at least ${rule.min}`;
    }
    if (rule.max !== undefined && value > rule.max) {
      return `Field '${rule.field}' must be at most ${rule.max}`;
    }
  }

  // Custom validation
  if (rule.custom) {
    const result = rule.custom(value);
    if (typeof result === "string") {
      return result;
    }
    if (result === false) {
      return `Field '${rule.field}' failed custom validation`;
    }
  }

  return null;
}

function createValidationMiddleware(
  source: "body" | "params" | "query",
  options: ValidationOptions
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    const errors: string[] = [];

    // Validate each rule
    for (const rule of options.rules) {
      const value = data?.[rule.field];
      const error = validateValue(value, rule);
      if (error) {
        errors.push(error);
      }
    }

    // Check for unknown fields if not allowed
    if (!options.allowUnknown && data && typeof data === "object") {
      const allowedFields = options.rules.map((rule) => rule.field);
      const unknownFields = Object.keys(data).filter(
        (key) => !allowedFields.includes(key)
      );
      if (unknownFields.length > 0) {
        errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
      }
    }

    if (errors.length > 0) {
      return sendError(
        res,
        `Validation failed: ${errors.join(", ")}`,
        HttpStatus.BAD_REQUEST
      );
    }

    next();
  };
}

export function ValidateBody(options: ValidationOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const middleware = createValidationMiddleware("body", options);

    if (Array.isArray(originalMethod)) {
      // Method already has middlewares, insert validation before the last one
      const lastHandler = originalMethod[originalMethod.length - 1];
      descriptor.value = [
        ...originalMethod.slice(0, -1),
        middleware,
        lastHandler,
      ];
    } else {
      // Method doesn't have middlewares, create array
      descriptor.value = [middleware, originalMethod];
    }

    return descriptor;
  };
}

export function ValidateParams(options: ValidationOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const middleware = createValidationMiddleware("params", options);

    if (Array.isArray(originalMethod)) {
      // Method already has middlewares, insert validation before the last one
      const lastHandler = originalMethod[originalMethod.length - 1];
      descriptor.value = [
        ...originalMethod.slice(0, -1),
        middleware,
        lastHandler,
      ];
    } else {
      // Method doesn't have middlewares, create array
      descriptor.value = [middleware, originalMethod];
    }

    return descriptor;
  };
}

export function ValidateQuery(options: ValidationOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const middleware = createValidationMiddleware("query", options);

    // Store query validation metadata for OpenAPI generation
    Reflect.defineMetadata("validation:query", options, target, propertyKey);

    if (Array.isArray(originalMethod)) {
      // Method already has middlewares, insert validation before the last one
      const lastHandler = originalMethod[originalMethod.length - 1];
      descriptor.value = [
        ...originalMethod.slice(0, -1),
        middleware,
        lastHandler,
      ];
    } else {
      // Method doesn't have middlewares, create array
      descriptor.value = [middleware, originalMethod];
    }

    return descriptor;
  };
}

// Common validation patterns
export const ValidationPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-()]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  MONGODB_ID: /^[0-9a-fA-F]{24}$/,
  URL: /^https?:\/\/.+/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;
