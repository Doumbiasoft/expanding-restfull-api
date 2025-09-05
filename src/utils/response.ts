import { ApiResponse } from "../types/response";
import { Response } from "express";
import { HttpStatus } from "../types/httpStatus";

// ✅ Success handler
export const sendResponse = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode?: HttpStatus
): Response<ApiResponse<T>> => {
  if (!statusCode) {
    const method = res.req.method;
    if (method === "POST" || method === "PUT") {
      statusCode = HttpStatus.CREATED;
    } else {
      statusCode = HttpStatus.OK;
    }
  }
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};
// ❌ Error handler
export const sendError = (
  res: Response,
  message = "Error",
  statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
): Response<ApiResponse<null>> => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
  });
};
