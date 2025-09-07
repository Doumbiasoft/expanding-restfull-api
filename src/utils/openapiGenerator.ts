import { ControllerRegistryManager } from "./controllerRegistry";
import path from "path";
import fs from "fs";

export interface RouteMapping {
  controllerName: string;
  routePrefix: string;
}

export class OpenAPIGenerator {
  private static routeMappings: RouteMapping[] = [];
  private static baseInfo = {
    version: "1.0.0",
    title: "API Documentation",
    description: "Auto-generated API documentation from controller decorators",
  };

  /**
   * Automatically discover and load controllers from the controllers directory
   */
  static async autoDiscoverControllers(
    controllersDir: string
  ): Promise<RouteMapping[]> {
    const mappings: RouteMapping[] = [];

    try {
      // Check if directory exists
      if (!fs.existsSync(controllersDir)) {
        console.warn(`Controllers directory not found: ${controllersDir}`);
        return mappings;
      }

      // Read all files in the controllers directory
      const files = fs.readdirSync(controllersDir);

      // Filter for controller files (*.controller.js or *.controller.ts)
      const controllerFiles = files.filter(
        (file) =>
          file.endsWith(".controller.js") || file.endsWith(".controller.ts")
      );

      for (const file of controllerFiles) {
        const filePath = path.join(controllersDir, file);

        // Extract controller name from filename
        // e.g., "user.controller.js" -> "UserController"
        const baseName = path.basename(file, path.extname(file));
        const entityName = baseName.replace(".controller", "");
        const controllerName =
          entityName.charAt(0).toUpperCase() +
          entityName.slice(1) +
          "Controller";

        // Generate route prefix from entity name
        // e.g., "user" -> "/users", "post" -> "/posts"
        const routePrefix = `/${entityName}${
          entityName.endsWith("s") ? "" : "s"
        }`;

        mappings.push({
          controllerName,
          routePrefix,
        });

        // Dynamically import the controller to register it
        try {
          await import(filePath);
          console.log(
            `✅ Dynamically loaded controller: ${controllerName} -> ${routePrefix}`
          );
        } catch (error) {
          console.warn(
            `⚠️  Failed to load controller ${controllerName}:`,
            error
          );
        }
      }

      return mappings;
    } catch (error) {
      console.error("Error discovering controllers:", error);
      return mappings;
    }
  }

  /**
   * Generate route mappings from already registered controllers
   */
  static generateDynamicRouteMappings(): RouteMapping[] {
    const registeredControllers = ControllerRegistryManager.getAllControllers();
    const mappings: RouteMapping[] = [];

    for (const [controllerName] of registeredControllers) {
      // Extract entity name from controller name
      // e.g., "UserController" -> "user"
      const entityName = controllerName.replace("Controller", "").toLowerCase();

      // Generate route prefix
      const routePrefix = `/${entityName}${
        entityName.endsWith("s") ? "" : "s"
      }`;

      mappings.push({
        controllerName,
        routePrefix,
      });
    }

    return mappings;
  }

  /**
   * Automatically discover route mappings by scanning the routes directory
   */
  static autoDiscoverRouteMappings(routesDir: string): RouteMapping[] {
    const mappings: RouteMapping[] = [];

    try {
      // Read the main routes index file
      const indexPath = path.join(routesDir, "index.ts");
      if (!fs.existsSync(indexPath)) {
        console.warn(`Routes index file not found at ${indexPath}`);
        return mappings;
      }

      const indexContent = fs.readFileSync(indexPath, "utf-8");

      // Parse router.use() statements to extract route prefixes
      const routerUseRegex =
        /router\.use\s*\(\s*["']([^"']+)["']\s*,\s*(\w+)\s*\)/g;
      let match;

      while ((match = routerUseRegex.exec(indexContent)) !== null) {
        const routePrefix = match[1];
        const routerVariable = match[2];

        // Find the import for this router variable
        const importRegex = new RegExp(
          `import\\s+${routerVariable}\\s+from\\s+["']([^"']+)["']`
        );
        const importMatch = indexContent.match(importRegex);

        if (importMatch) {
          const routeFile = importMatch[1];
          // Extract controller name from route file (e.g., "./user.routes" -> "UserController")
          const routeName = path
            .basename(routeFile, ".routes")
            .replace(/[.-]/g, "");
          const controllerName =
            routeName.charAt(0).toUpperCase() +
            routeName.slice(1) +
            "Controller";

          mappings.push({
            controllerName,
            routePrefix,
          });
        }
      }
    } catch (error) {
      console.error("Error auto-discovering route mappings:", error);
    }

    return mappings;
  }

  /**
   * Initialize with auto-discovered or manual route mappings
   */
  static async initialize(
    routesDir?: string,
    customMappings?: RouteMapping[],
    controllersDir?: string
  ) {
    if (customMappings) {
      this.routeMappings = customMappings;
    } else if (controllersDir) {
      // Use dynamic controller discovery
      const dynamicMappings = await this.autoDiscoverControllers(
        controllersDir
      );
      this.routeMappings = dynamicMappings;
    } else if (routesDir) {
      this.routeMappings = this.autoDiscoverRouteMappings(routesDir);
    } else {
      // Fallback to dynamic discovery from registered controllers
      const dynamicMappings = this.generateDynamicRouteMappings();
      this.routeMappings = dynamicMappings;
    }
  }

  /**
   * Set custom OpenAPI info
   */
  static setInfo(info: Partial<typeof OpenAPIGenerator.baseInfo>) {
    this.baseInfo = { ...this.baseInfo, ...info };
  }

  /**
   * Generate complete OpenAPI specification with automatic route mapping
   */
  static generateSpec(basePath: string = "/v1"): any {
    const baseSpec = {
      openapi: "3.0.0",
      info: this.baseInfo,
      paths: {} as any,
    };

    // Get all registered controllers
    const controllers = ControllerRegistryManager.getAllControllers();

    for (const [controllerName] of controllers) {
      // Find route mapping for this controller
      const mapping = this.routeMappings.find(
        (m) => m.controllerName === controllerName
      );
      const routePrefix = mapping?.routePrefix || "";

      // Generate OpenAPI spec for this controller
      const controllerSpec =
        ControllerRegistryManager.generateOpenAPISpec(controllerName);

      // Add paths with proper prefixing
      for (const [path, methods] of Object.entries(controllerSpec.paths)) {
        // Normalize path to avoid trailing slashes when route path is "/"
        const normalizedPath = path === "/" ? "" : path;
        const fullPath = `${basePath}${routePrefix}${normalizedPath}`;
        baseSpec.paths[fullPath] = methods;
      }
    }

    return baseSpec;
  }

  /**
   * Get current route mappings
   */
  static getRouteMappings(): RouteMapping[] {
    return [...this.routeMappings];
  }

  /**
   * Add custom route mapping
   */
  static addRouteMapping(mapping: RouteMapping) {
    const existingIndex = this.routeMappings.findIndex(
      (m) => m.controllerName === mapping.controllerName
    );
    if (existingIndex >= 0) {
      this.routeMappings[existingIndex] = mapping;
    } else {
      this.routeMappings.push(mapping);
    }
  }

  /**
   * Create Express middleware to serve OpenAPI spec
   */
  static createSpecMiddleware(basePath: string = "/v1") {
    return (_req: any, res: any) => {
      const spec = this.generateSpec(basePath);
      res.json(spec);
    };
  }

  /**
   * Auto-setup OpenAPI endpoints on Express app
   */
  static async setupEndpoints(
    app: any,
    options: {
      specPath?: string;
      docsPath?: string;
      swaggerPath?: string;
      basePath?: string;
      routesDir?: string;
      controllersDir?: string;
      customMappings?: RouteMapping[];
      info?: Partial<typeof OpenAPIGenerator.baseInfo>;
      enableSwagger?: boolean;
      enableScalar?: boolean;
    } = {}
  ) {
    const {
      specPath = "/api-docs",
      docsPath = "/docs",
      swaggerPath = "/swagger",
      basePath = "/v1",
      routesDir,
      controllersDir,
      customMappings,
      info,
      enableSwagger = true,
      enableScalar = true,
    } = options;

    // Initialize route mappings
    await this.initialize(routesDir, customMappings, controllersDir);

    // Set custom info if provided
    if (info) {
      this.setInfo(info);
    }

    // Add spec endpoint
    app.get(specPath, this.createSpecMiddleware(basePath));

    // Add Scalar UI (modern, clean interface)
    if (enableScalar) {
      try {
        const { apiReference } = require("@scalar/express-api-reference");
        app.use(
          docsPath,
          apiReference({
            spec: { url: specPath },
            theme: "purple",
          })
        );
      } catch (error) {
        console.warn(
          "Scalar API Reference not available, skipping Scalar endpoint"
        );
      }
    }

    // Add Swagger UI (traditional, feature-rich interface)
    if (enableSwagger) {
      try {
        const swaggerUi = require("swagger-ui-express");

        // Create middleware that serves the spec dynamically
        const swaggerSetup = (req: any, res: any, next: any) => {
          const spec = this.generateSpec(basePath);
          req.swaggerDoc = spec;
          next();
        };

        app.use(swaggerPath, swaggerSetup, swaggerUi.serve, swaggerUi.setup());
      } catch (error) {
        console.warn(
          "swagger-ui-express not available, skipping Swagger UI endpoint"
        );
      }
    }
  }

  /**
   * Generate statistics about the OpenAPI spec
   */
  static getStats() {
    const spec = this.generateSpec();
    const pathCount = Object.keys(spec.paths).length;

    let totalEndpoints = 0;
    const methodCounts: { [method: string]: number } = {};

    for (const methods of Object.values(spec.paths)) {
      for (const method of Object.keys(methods as any)) {
        totalEndpoints++;
        methodCounts[method] = (methodCounts[method] || 0) + 1;
      }
    }

    return {
      totalPaths: pathCount,
      totalEndpoints,
      methodCounts,
      routeMappings: this.routeMappings.length,
      controllers: ControllerRegistryManager.getAllControllers().size,
    };
  }
}

// Convenience exports
export const {
  initialize,
  setInfo,
  generateSpec,
  getRouteMappings,
  addRouteMapping,
  createSpecMiddleware,
  setupEndpoints,
  getStats,
} = OpenAPIGenerator;
