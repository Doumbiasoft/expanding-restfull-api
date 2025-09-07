import {
  controllerRegistry,
  ControllerMetadata,
  MethodMetadata,
  RouteMetadata,
} from "../decorators/controller.decorator";
import { Router } from "express";
import "colors";

export class ControllerRegistryManager {
  static getAllControllers(): Map<string, ControllerMetadata> {
    return controllerRegistry.getAllControllers();
  }

  static getController(name: string): ControllerMetadata | undefined {
    return controllerRegistry.get(name);
  }

  static getControllerMethods(
    name: string
  ): Map<string, MethodMetadata> | undefined {
    return controllerRegistry.getControllerMethods(name);
  }

  static getControllerRoutes(name: string): RouteMetadata[] | undefined {
    return controllerRegistry.getControllerRoutes(name);
  }

  static listAllMethods(): { [controllerName: string]: string[] } {
    const result: { [controllerName: string]: string[] } = {};

    for (const [name, controller] of this.getAllControllers()) {
      result[name] = Array.from(controller.methods.keys());
    }

    return result;
  }

  static listAllRoutes(): { [controllerName: string]: RouteMetadata[] } {
    const result: { [controllerName: string]: RouteMetadata[] } = {};

    for (const [name, controller] of this.getAllControllers()) {
      result[name] = controller.routes;
    }

    return result;
  }

  static findMethodByName(methodName: string): {
    controllerName: string;
    controller: ControllerMetadata;
    method: MethodMetadata;
  }[] {
    const results: {
      controllerName: string;
      controller: ControllerMetadata;
      method: MethodMetadata;
    }[] = [];

    for (const [name, controller] of this.getAllControllers()) {
      const method = controller.methods.get(methodName);
      if (method) {
        results.push({
          controllerName: name,
          controller,
          method,
        });
      }
    }

    return results;
  }

  static findRouteByPath(
    path: string,
    method?: string
  ): {
    controllerName: string;
    controller: ControllerMetadata;
    route: RouteMetadata;
  }[] {
    const results: {
      controllerName: string;
      controller: ControllerMetadata;
      route: RouteMetadata;
    }[] = [];

    for (const [name, controller] of this.getAllControllers()) {
      for (const route of controller.routes) {
        if (route.path === path && (!method || route.method === method)) {
          results.push({
            controllerName: name,
            controller,
            route,
          });
        }
      }
    }

    return results;
  }

  static createRouter(controllerName: string, basePath: string = ""): Router {
    const router = Router();
    const controller = this.getController(controllerName);

    if (!controller) {
      throw new Error(`Controller '${controllerName}' not found in registry`);
    }

    for (const route of controller.routes) {
      const fullPath = basePath + route.path;
      const handlers = [...route.middlewares, route.handler];

      switch (route.method) {
        case "get":
          router.get(fullPath, ...handlers);
          break;
        case "post":
          router.post(fullPath, ...handlers);
          break;
        case "put":
          router.put(fullPath, ...handlers);
          break;
        case "patch":
          router.patch(fullPath, ...handlers);
          break;
        case "delete":
          router.delete(fullPath, ...handlers);
          break;
        default:
          console.warn(`Unknown HTTP method: ${route.method}`);
      }
    }

    return router;
  }

  static generateOpenAPISpec(controllerName?: string): any {
    const paths: any = {};
    const controllersToProcess = controllerName
      ? [controllerName]
      : Array.from(this.getAllControllers().keys());

    for (const name of controllersToProcess) {
      const controller = this.getController(name);
      if (!controller) continue;

      for (const route of controller.routes) {
        const pathKey = route.path.replace(/:([^/]+)/g, "{$1}");

        if (!paths[pathKey]) {
          paths[pathKey] = {};
        }

        const operation: any = {
          summary:
            route.summary || `${route.method.toUpperCase()} ${route.path}`,
          description: route.description,
          tags: route.tags || [name.replace("Controller", "")],
          responses: {
            200: {
              description: "Success",
              content: {
                "application/json": {
                  schema: { type: "object" },
                },
              },
            },
            400: { description: "Bad Request" },
            401: { description: "Unauthorized" },
            403: { description: "Forbidden" },
            404: { description: "Not Found" },
            429: { description: "Too Many Requests" },
            500: { description: "Internal Server Error" },
          },
        };

        // Add request body examples if they exist
        if (
          route.requestExamples &&
          route.requestExamples.length > 0 &&
          (route.method === "post" ||
            route.method === "put" ||
            route.method === "patch")
        ) {
          operation.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { type: "object" },
                examples: {},
              },
            },
          };

          route.requestExamples.forEach((example, index) => {
            const exampleKey = example.summary || `example${index + 1}`;
            operation.requestBody.content["application/json"].examples[
              exampleKey
            ] = {
              summary: example.summary,
              description: example.description,
              value: example.value,
            };
          });
        }

        // Add response examples if they exist
        if (route.responseExamples && route.responseExamples.length > 0) {
          route.responseExamples.forEach((example) => {
            const statusCode = example.status.toString();
            if (!operation.responses[statusCode]) {
              operation.responses[statusCode] = {
                description: example.description || "Response",
                content: {
                  "application/json": {
                    schema: { type: "object" },
                    examples: {},
                  },
                },
              };
            } else {
              // Ensure content structure exists
              if (!operation.responses[statusCode].content) {
                operation.responses[statusCode].content = {
                  "application/json": {
                    schema: { type: "object" },
                    examples: {},
                  },
                };
              } else if (
                !operation.responses[statusCode].content["application/json"]
              ) {
                operation.responses[statusCode].content["application/json"] = {
                  schema: { type: "object" },
                  examples: {},
                };
              } else if (
                !operation.responses[statusCode].content["application/json"]
                  .examples
              ) {
                operation.responses[statusCode].content[
                  "application/json"
                ].examples = {};
              }
            }

            const exampleKey = example.summary || `example_${statusCode}`;
            operation.responses[statusCode].content[
              "application/json"
            ].examples[exampleKey] = {
              summary: example.summary,
              description: example.description,
              value: example.value,
            };
          });
        }

        paths[pathKey][route.method] = operation;

        // Add path parameters
        const pathParams = route.path.match(/:([^/]+)/g);
        if (pathParams) {
          paths[pathKey][route.method].parameters = pathParams.map(
            (param: string) => ({
              name: param.substring(1),
              in: "path",
              required: true,
              schema: { type: "string" },
            })
          );
        }
      }
    }

    return {
      openapi: "3.0.0",
      info: {
        title: "API Documentation",
        version: "1.0.0",
        description:
          "Auto-generated API documentation from controller decorators",
      },
      paths,
    };
  }

  static getControllerStats(): {
    totalControllers: number;
    totalMethods: number;
    totalRoutes: number;
    controllerBreakdown: {
      [name: string]: { methods: number; routes: number };
    };
  } {
    const controllers = this.getAllControllers();
    let totalMethods = 0;
    let totalRoutes = 0;
    const controllerBreakdown: {
      [name: string]: { methods: number; routes: number };
    } = {};

    for (const [name, controller] of controllers) {
      const methodCount = controller.methods.size;
      const routeCount = controller.routes.length;

      totalMethods += methodCount;
      totalRoutes += routeCount;

      controllerBreakdown[name] = {
        methods: methodCount,
        routes: routeCount,
      };
    }

    return {
      totalControllers: controllers.size,
      totalMethods,
      totalRoutes,
      controllerBreakdown,
    };
  }

  static printRegistryInfo(): void {
    const stats = this.getControllerStats();

    console.log("\n=== Controller Registry Info ===");
    console.log(
      `Total Controllers: ${stats.totalControllers.toString().green}`
    );
    console.log(`Total Methods: ${stats.totalMethods.toString().green}`);
    console.log(`Total Routes: ${stats.totalRoutes.toString().green}`);

    console.log("\n=== Controller Breakdown ===");
    for (const [name, breakdown] of Object.entries(stats.controllerBreakdown)) {
      console.log(
        `${name}: ${breakdown.methods.toString().green} methods, ${
          breakdown.routes.toString().green
        } routes`
      );
    }

    console.log("\n=== Route Details ===");
    const allRoutes = this.listAllRoutes();
    for (const [controllerName, routes] of Object.entries(allRoutes)) {
      console.log(`\n${controllerName.red}:`);
      for (const route of routes) {
        console.log(
          `  ${route.method.toUpperCase().cyan} ${route.path.yellow} - ${
            route.summary || "No summary"
          }`
        );
      }
    }
  }
}

// Convenience exports
export const {
  getAllControllers,
  getController,
  getControllerMethods,
  getControllerRoutes,
  listAllMethods,
  listAllRoutes,
  findMethodByName,
  findRouteByPath,
  createRouter,
  generateOpenAPISpec,
  getControllerStats,
  printRegistryInfo,
} = ControllerRegistryManager;
