import { Request, Response } from "express";
import { Users } from "../config/database";
import { sendResponse, sendError } from "../utils/response";
import { Controller } from "../decorators/controller.decorator";
import { Get, Post, Delete, Patch } from "../decorators/route.decorator";
import { LogRequest } from "../decorators/utility.decorator";
import { HttpStatus } from "../types/httpStatus";
import {
  ValidateBody,
  ValidateParams,
  ValidationPatterns,
} from "../decorators/validation.decorator";
import {
  findAllUsers,
  findUserById,
  createUser,
  findUser,
  updateUserById,
  deleteUserById,
} from "../services/user.service";
import { findAllPosts } from "../services/post.service";

@Controller("UserController")
class UserController {
  @Get("/", {
    summary: "Get all users",
    description: "Retrieve a list of all users in the system",
    tags: ["Users"],
  })
  @LogRequest()
  async getUsers(req: Request, res: Response) {
    const users: Users = findAllUsers();
    return sendResponse(res, users);
  }
  @Post("/", {
    summary: "Create a user",
    description: "Create a new user in the system",
    tags: ["Users"],
    requestExamples: [
      {
        summary: "Create regular user",
        description: "Example request to create a new regular user",
        value: {
          name: "John Doe",
          username: "johndoe",
          email: "john.doe@example.com",
        },
      },
    ],
  })
  @ValidateBody({
    rules: [
      {
        field: "name",
        required: true,
        type: "string",
        minLength: 3,
        maxLength: 50,
      },
      {
        field: "username",
        required: true,
        type: "string",
        minLength: 3,
        maxLength: 50,
      },
      {
        field: "email",
        required: true,
        type: "string",
        pattern: ValidationPatterns.EMAIL,
      },
    ],
  })
  @LogRequest()
  async addUser(req: Request, res: Response) {
    const exitUser = findUser({ username: req.body.username });
    if (exitUser)
      return sendError(
        res,
        `This username: ${req.body.username} is already taken`,
        HttpStatus.BAD_REQUEST
      );
    const user = createUser(req.body);
    return sendResponse(res, user);
  }
  @Get("/:id", {
    summary: "Get a user",
    description: "Retrieve a specific user by id in the system",
    tags: ["Users"],
  })
  @ValidateParams({
    rules: [
      {
        field: "id",
        required: true,
        type: "string",
      },
    ],
  })
  @LogRequest()
  async getUserById(req: Request, res: Response) {
    const userId = Number(req.params.id);
    const user = findUserById(userId);
    if (!user) return sendError(res, "User not found", HttpStatus.NOT_FOUND);
    return sendResponse(res, user);
  }

  @Get("/:id/posts", {
    summary: "Get a user's posts",
    description:
      "Retrieve all posts for a specific user using parameters in the system",
    tags: ["Users"],
  })
  @ValidateParams({
    rules: [
      {
        field: "id",
        required: true,
        type: "string",
      },
    ],
  })
  @LogRequest()
  async getUserPosts(req: Request, res: Response) {
    const userId = Number(req.params.id);
    const user = findUserById(userId);
    if (!user) return sendError(res, "User not found", HttpStatus.NOT_FOUND);
    const posts = findAllPosts(userId);
    return sendResponse(res, posts);
  }

  @Patch("/:id", {
    summary: "Update a user",
    description: "Update a specific user in the system",
    tags: ["Users"],
    requestExamples: [
      {
        summary: "Update user name",
        description: "Example request to update only the user's name",
        value: {
          id: 1,
          name: "Carey Williams",
        },
      },
      {
        summary: "Update user email",
        description: "Example request to update only the user's email",
        value: {
          id: 1,
          email: "carey.williams@newdomain.com",
        },
      },
      {
        summary: "Update multiple fields",
        description: "Example request to update name, username and email",
        value: {
          id: 1,
          name: "Carey Williams",
          username: "careyW",
          email: "carey.williams@newdomain.com",
        },
      },
    ],
  })
  @ValidateParams({
    rules: [
      {
        field: "id",
        required: true,
        type: "string",
      },
    ],
  })
  @ValidateBody({
    rules: [
      {
        field: "id",
        required: true,
        type: "number",
      },
      {
        field: "name",
        required: false,
        type: "string",
      },
      {
        field: "email",
        required: false,
        type: "string",
      },
      {
        field: "username",
        required: false,
        type: "string",
      },
    ],
  })
  @LogRequest()
  async updateUser(req: Request, res: Response) {
    if (Number(req.params.id) !== Number(req.body.id))
      return sendError(
        res,
        "Resource to update not found",
        HttpStatus.BAD_REQUEST
      );
    const userId = Number(req.params.id);
    const user = findUserById(userId);
    if (!user) return sendError(res, "User not found", HttpStatus.NOT_FOUND);
    const updatedUser = updateUserById(userId, req.body);
    return sendResponse(res, updatedUser);
  }
  @Delete("/:id", {
    summary: "Delete a user",
    description: "Delete a specific user in the system",
    tags: ["Users"],
  })
  @ValidateParams({
    rules: [
      {
        field: "id",
        required: true,
        type: "string",
      },
    ],
  })
  @LogRequest()
  async deleteUser(req: Request, res: Response) {
    const userId = Number(req.params.id);
    const user = findUserById(userId);
    if (!user) return sendError(res, "User not found", HttpStatus.NOT_FOUND);
    const deletedUser = deleteUserById(userId);
    return sendResponse(res, deletedUser);
  }
}

const userController = new UserController();
export const getUsers = userController.getUsers;
export const getUserById = userController.getUserById;
export const getUserPosts = userController.getUserPosts;
export const addUser = userController.addUser;
export const updateUser = userController.updateUser;
export const deleteUser = userController.deleteUser;

// Export the controller class for route building
export { UserController };
