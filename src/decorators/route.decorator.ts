import { Router } from "express";
import { controllerRegistry, RouteMetadata } from "./controller.decorator";
import { RequestExample, ResponseExample } from "./example.decorator";

export interface RouteOptions {
  path?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  requestExamples?: RequestExample[];
  responseExamples?: ResponseExample[];
}

// HTTP Method decorators
export function Get(
  path: string = "",
  options: Omit<RouteOptions, "path"> = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata(
      "route:info",
      {
        method: "get",
        path,
        summary: options.summary,
        description: options.description,
        tags: options.tags,
        requestExamples: options.requestExamples,
        responseExamples: options.responseExamples,
      },
      target,
      propertyKey
    );
    return descriptor;
  };
}

export function Post(
  path: string = "",
  options: Omit<RouteOptions, "path"> = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata(
      "route:info",
      {
        method: "post",
        path,
        summary: options.summary,
        description: options.description,
        tags: options.tags,
        requestExamples: options.requestExamples,
        responseExamples: options.responseExamples,
      },
      target,
      propertyKey
    );
    return descriptor;
  };
}

export function Put(
  path: string = "",
  options: Omit<RouteOptions, "path"> = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata(
      "route:info",
      {
        method: "put",
        path,
        summary: options.summary,
        description: options.description,
        tags: options.tags,
        requestExamples: options.requestExamples,
        responseExamples: options.responseExamples,
      },
      target,
      propertyKey
    );
    return descriptor;
  };
}

export function Patch(
  path: string = "",
  options: Omit<RouteOptions, "path"> = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata(
      "route:info",
      {
        method: "patch",
        path,
        summary: options.summary,
        description: options.description,
        tags: options.tags,
        requestExamples: options.requestExamples,
        responseExamples: options.responseExamples,
      },
      target,
      propertyKey
    );
    return descriptor;
  };
}

export function Delete(
  path: string = "",
  options: Omit<RouteOptions, "path"> = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata(
      "route:info",
      {
        method: "delete",
        path,
        summary: options.summary,
        description: options.description,
        tags: options.tags,
        requestExamples: options.requestExamples,
        responseExamples: options.responseExamples,
      },
      target,
      propertyKey
    );
    return descriptor;
  };
}

// Route builder utility
export function buildRoutes(
  controllerName: string,
  basePath: string = ""
): Router {
  const router = Router();
  const controller = controllerRegistry.get(controllerName);

  if (!controller) {
    throw new Error(`Controller '${controllerName}' not found in registry`);
  }

  for (const route of controller.routes) {
    const fullPath = basePath + route.path;
    const middlewares = route.middlewares;
    const handler = route.handler;

    // Combine middlewares and handler
    const routeHandlers = [...middlewares, handler];

    switch (route.method) {
      case "get":
        router.get(fullPath, ...routeHandlers);
        break;
      case "post":
        router.post(fullPath, ...routeHandlers);
        break;
      case "put":
        router.put(fullPath, ...routeHandlers);
        break;
      case "patch":
        router.patch(fullPath, ...routeHandlers);
        break;
      case "delete":
        router.delete(fullPath, ...routeHandlers);
        break;
    }
  }

  return router;
}

// Auto-generate OpenAPI documentation
export function generateOpenAPISpec(
  controllerName: string,
  basePath: string = ""
): any {
  const controller = controllerRegistry.get(controllerName);

  if (!controller) {
    throw new Error(`Controller '${controllerName}' not found in registry`);
  }

  const paths: any = {};

  for (const route of controller.routes) {
    // Normalize path to avoid trailing slashes when route path is "/"
    const normalizedPath = route.path === "/" ? "" : route.path;
    const fullPath = (basePath + normalizedPath).replace(/:([^/]+)/g, "{$1}");

    if (!paths[fullPath]) {
      paths[fullPath] = {};
    }

    paths[fullPath][route.method] = {
      summary: route.summary,
      description: route.description,
      tags: route.tags,
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        400: {
          description: "Bad Request",
        },
        401: {
          description: "Unauthorized",
        },
        403: {
          description: "Forbidden",
        },
        404: {
          description: "Not Found",
        },
        500: {
          description: "Internal Server Error",
        },
      },
    };

    // Add parameters for path variables
    const pathParams = (basePath + route.path).match(/:([^/]+)/g);
    if (pathParams) {
      paths[fullPath][route.method].parameters = pathParams.map(
        (param: string) => ({
          name: param.substring(1), // Remove ':'
          in: "path",
          required: true,
          schema: { type: "string" },
        })
      );
    }
  }

  return {
    openapi: "3.0.0",
    info: {
      title: `${controllerName} API`,
      version: "1.0.0",
    },
    paths,
  };
}

// Utility to list all routes
export function listRoutes(controllerName?: string): RouteMetadata[] {
  if (controllerName) {
    const controller = controllerRegistry.get(controllerName);
    return controller?.routes || [];
  }

  const allRoutes: RouteMetadata[] = [];
  for (const [name, controller] of controllerRegistry.getAllControllers()) {
    allRoutes.push(...controller.routes);
  }

  return allRoutes;
}

// Route prefix decorator for controllers
export function RoutePrefix(prefix: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    // Store the prefix in metadata
    Reflect.defineMetadata("route:prefix", prefix, constructor);
    return constructor;
  };
}
