import { RequestHandler } from "express";
import { catchAsync } from "../utils/catchAsync";
import { RequestExample, ResponseExample } from "./example.decorator";

export interface ControllerMetadata {
  target: any;
  instance: any;
  methods: Map<string, MethodMetadata>;
  routes: RouteMetadata[];
}

export interface MethodMetadata {
  name: string;
  middlewares: RequestHandler[];
  handler: RequestHandler;
  boundHandler: RequestHandler;
  routeInfo?: RouteInfo;
}

export interface RouteMetadata {
  method: string;
  path: string;
  handler: RequestHandler;
  middlewares: RequestHandler[];
  summary?: string;
  description?: string;
  tags?: string[];
  requestExamples?: RequestExample[];
  responseExamples?: ResponseExample[];
}

export interface RouteInfo {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  requestExamples?: RequestExample[];
  responseExamples?: ResponseExample[];
}

class ControllerRegistry {
  private controllers = new Map<string, ControllerMetadata>();

  register(name: string, metadata: ControllerMetadata): void {
    this.controllers.set(name, metadata);
  }

  get(name: string): ControllerMetadata | undefined {
    return this.controllers.get(name);
  }

  getAllControllers(): Map<string, ControllerMetadata> {
    return new Map(this.controllers);
  }

  getControllerMethods(name: string): Map<string, MethodMetadata> | undefined {
    return this.controllers.get(name)?.methods;
  }

  getControllerRoutes(name: string): RouteMetadata[] | undefined {
    return this.controllers.get(name)?.routes;
  }
}

export const controllerRegistry = new ControllerRegistry();

export function Controller(name?: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    const controllerName = name || constructor.name;
    const instance = new constructor();
    const methods = new Map<string, MethodMetadata>();
    const routes: RouteMetadata[] = [];

    // Get all method names from the prototype
    const prototype = constructor.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype).filter((name) => {
      if (name === "constructor") return false;
      const prop = prototype[name];
      // Include both regular functions and decorated methods (arrays)
      return typeof prop === "function" || Array.isArray(prop);
    });

    // Process each method
    for (const methodName of methodNames) {
      const method = prototype[methodName];
      const middlewares: RequestHandler[] = [];
      let handler: RequestHandler;

      // Check if method was decorated (returns array of middlewares)
      if (Array.isArray(method)) {
        // Method was decorated, it's already an array of [middleware1, middleware2, ..., handler]
        middlewares.push(...method.slice(0, -1)); // All but last are middlewares
        handler = method[method.length - 1]; // Last one is the handler
      } else {
        // Method was not decorated, use it directly
        handler = method.bind(instance);
      }

      // Wrap handler with catchAsync if it's an async function
      const boundHandler =
        typeof handler === "function" ? catchAsync(handler as any) : handler;

      // Get route metadata if exists
      const routeInfo: RouteInfo | undefined = Reflect.getMetadata(
        "route:info",
        prototype,
        methodName
      );

      const methodMetadata: MethodMetadata = {
        name: methodName,
        middlewares,
        handler,
        boundHandler,
        routeInfo,
      };

      methods.set(methodName, methodMetadata);

      // Add to routes if route info exists
      if (routeInfo) {
        routes.push({
          method: routeInfo.method,
          path: routeInfo.path,
          handler: boundHandler,
          middlewares,
          summary: routeInfo.summary,
          description: routeInfo.description,
          tags: routeInfo.tags,
          requestExamples: routeInfo.requestExamples,
          responseExamples: routeInfo.responseExamples,
        });
      }
    }

    const metadata: ControllerMetadata = {
      target: constructor,
      instance,
      methods,
      routes,
    };

    controllerRegistry.register(controllerName, metadata);

    // Create export object with all methods
    const exportObject: any = {};
    for (const [methodName, methodMeta] of methods) {
      if (methodMeta.middlewares.length > 0) {
        // For decorated methods, return the full middleware chain including the handler
        exportObject[methodName] = [
          ...methodMeta.middlewares,
          methodMeta.boundHandler,
        ];
      } else {
        // For non-decorated methods, return just the bound handler
        exportObject[methodName] = methodMeta.boundHandler;
      }
    }

    // Add static methods to constructor
    (constructor as any).getExports = () => exportObject;
    (constructor as any).getMetadata = () => metadata;
    (constructor as any).getInstance = () => instance;

    return constructor;
  };
}
