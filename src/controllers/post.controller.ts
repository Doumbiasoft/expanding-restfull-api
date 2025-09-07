import { Request, Response } from "express";
import { Posts } from "../config/database";
import { sendResponse, sendError } from "../utils/response";
import { Controller } from "../decorators/controller.decorator";
import { Get, Post, Delete, Patch } from "../decorators/route.decorator";
import { LogRequest } from "../decorators/utility.decorator";
import { HttpStatus } from "../types/httpStatus";
import {
  ValidateBody,
  ValidateParams,
} from "../decorators/validation.decorator";
import {
  createPost,
  deletePostById,
  findAllPosts,
  findPostById,
  updatePostById,
} from "../services/post.service";
import { findUserById } from "../services/user.service";

@Controller("PostController")
class PostController {
  @Get("/", {
    summary: "Get all posts",
    description: "Retrieve a list of all post in the system",
    tags: ["Posts"],
  })
  @LogRequest()
  async getPosts(req: Request, res: Response) {
    const posts: Posts = findAllPosts();
    return sendResponse(res, posts);
  }
  @Post("/", {
    summary: "Create a post",
    description: "Create a new post in the system",
    tags: ["Posts"],
  })
  @ValidateBody({
    rules: [
      {
        field: "userId",
        required: true,
        type: "number",
      },
      {
        field: "title",
        required: true,
        type: "string",
      },
      {
        field: "content",
        required: true,
        type: "string",
      },
    ],
  })
  @LogRequest()
  async addPost(req: Request, res: Response) {
    const exitUser = findUserById(req.body.userId);
    if (!exitUser)
      return sendError(res, `User not found`, HttpStatus.NOT_FOUND);
    const post = createPost(req.body);
    return sendResponse(res, post);
  }
  @Get("/:id", {
    summary: "Get a post",
    description: "Retrieve a specific post by id in the system",
    tags: ["Posts"],
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
  async getPostById(req: Request, res: Response) {
    const postId = Number(req.params.id);
    const post = findPostById(postId);
    if (!post) return sendError(res, "Post not found", HttpStatus.NOT_FOUND);
    return sendResponse(res, post);
  }
  @Patch("/:id", {
    summary: "Update a post",
    description: "Update a specific post in the system",
    tags: ["Posts"],
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
        field: "title",
        required: false,
        type: "string",
      },
      {
        field: "content",
        required: false,
        type: "string",
      },
    ],
  })
  @LogRequest()
  async updatePost(req: Request, res: Response) {
    if (Number(req.params.id) !== Number(req.body.id))
      return sendError(
        res,
        "Resource to update not found",
        HttpStatus.BAD_REQUEST
      );
    const updatedPost = updatePostById(Number(req.params.id), req.body);
    return sendResponse(res, updatedPost);
  }
  @Delete("/:id", {
    summary: "Delete a post",
    description: "Delete a specific post in the system",
    tags: ["Posts"],
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
  async deletePost(req: Request, res: Response) {
    const postId = Number(req.params.id);
    const post = findPostById(postId);
    if (!post) return sendError(res, "Post not found", HttpStatus.NOT_FOUND);
    const deletedPost = deletePostById(postId);
    return sendResponse(res, deletedPost);
  }
}

const postController = new PostController();
export const getPosts = postController.getPosts;
export const addPost = postController.addPost;
export const getPostById = postController.getPostById;
export const updatePost = postController.updatePost;
export const deletePost = postController.deletePost;

export { PostController };
