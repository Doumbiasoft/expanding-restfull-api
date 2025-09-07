export interface RequestExample {
  summary?: string;
  description?: string;
  value: any;
}

export interface ResponseExample {
  status: number;
  summary?: string;
  description?: string;
  value: any;
}

export interface ExampleMetadata {
  requestExamples?: RequestExample[];
  responseExamples?: ResponseExample[];
}

export function RequestBody(examples: RequestExample | RequestExample[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const exampleArray = Array.isArray(examples) ? examples : [examples];
    
    const existingMetadata: ExampleMetadata = 
      Reflect.getMetadata("examples", target, propertyKey) || {};
    
    Reflect.defineMetadata(
      "examples",
      {
        ...existingMetadata,
        requestExamples: exampleArray,
      },
      target,
      propertyKey
    );
    
    return descriptor;
  };
}

export function ResponseBody(examples: ResponseExample | ResponseExample[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const exampleArray = Array.isArray(examples) ? examples : [examples];
    
    const existingMetadata: ExampleMetadata = 
      Reflect.getMetadata("examples", target, propertyKey) || {};
    
    Reflect.defineMetadata(
      "examples",
      {
        ...existingMetadata,
        responseExamples: exampleArray,
      },
      target,
      propertyKey
    );
    
    return descriptor;
  };
}

export function getExampleMetadata(target: any, propertyKey: string): ExampleMetadata | undefined {
  return Reflect.getMetadata("examples", target, propertyKey);
}