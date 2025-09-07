import { Request, Response } from "express";
import { Comments } from "../config/database";
import { sendResponse, sendError } from "../utils/response";
import { Controller } from "../decorators/controller.decorator";
import { Get, Post, Delete, Patch } from "../decorators/route.decorator";
import { LogRequest } from "../decorators/utility.decorator";
import { HttpStatus } from "../types/httpStatus";
import {
  ValidateBody,
  ValidateParams,
  ValidateQuery,
} from "../decorators/validation.decorator";
import { findUserById } from "../services/user.service";
import {
  createComment,
  deleteCommentById,
  findAllComments,
  findCommentById,
  updateCommentById,
} from "../services/comment.service";
import { findPostById } from "../services/post.service";

@Controller("CommentController")
class CommentController {
  @Get("/", {
    summary: "Get all comments or a post's comments",
    description:
      "Retrieve a list of all comment or a post's comments by querying in the system",
    tags: ["Comments"],
  })
  @ValidateQuery({
    rules: [
      {
        field: "userId",
        required: false,
        type: "string",
      },
      {
        field: "postId",
        required: false,
        type: "string",
      },
    ],
  })
  @LogRequest()
  async getComments(req: Request, res: Response) {
    let comments: Comments = [];
    if (req.query.userId && req.query.postId) {
      const userId = Number(req.query.userId);
      const user = findUserById(userId);
      if (!user) return sendError(res, "User not found", HttpStatus.NOT_FOUND);
      const postId = Number(req.query.postId);
      const post = findPostById(postId);
      if (!post) return sendError(res, "Post not found", HttpStatus.NOT_FOUND);
      comments = findAllComments({ userId, postId });
      return sendResponse(res, comments);
    }
    if (req.query.userId) {
      const userId = Number(req.query.userId);
      const user = findUserById(userId);
      if (!user) return sendError(res, "User not found", HttpStatus.NOT_FOUND);
      comments = findAllComments({ userId });
      return sendResponse(res, comments);
    }
    if (req.query.postId) {
      const postId = Number(req.query.postId);
      const post = findPostById(postId);
      if (!post) return sendError(res, "Post not found", HttpStatus.NOT_FOUND);
      comments = findAllComments({ postId });
      return sendResponse(res, comments);
    }
    comments = findAllComments();
    return sendResponse(res, comments);
  }
  @Post("/", {
    summary: "Create a comment",
    description: "Create a new comment in the system",
    tags: ["Comments"],
    requestExamples: [
      {
        summary: "Create a comment on a post",
        description: "Example request to create a new comment",
        value: {
          userId: 2,
          postId: 7,
          body: "Thank you for sharing",
        },
      },
    ],
  })
  @ValidateBody({
    rules: [
      {
        field: "userId",
        required: true,
        type: "number",
      },
      {
        field: "postId",
        required: true,
        type: "number",
      },
      {
        field: "body",
        required: true,
        type: "string",
      },
    ],
  })
  @LogRequest()
  async addComment(req: Request, res: Response) {
    const userId = Number(req.body.userId);
    const user = findUserById(userId);
    if (!user) return sendError(res, "User not found", HttpStatus.NOT_FOUND);
    const postId = Number(req.body.postId);
    const post = findPostById(postId);
    if (!post) return sendError(res, "Post not found", HttpStatus.NOT_FOUND);
    const comment = createComment(req.body);
    return sendResponse(res, comment);
  }
  @Get("/:id", {
    summary: "Get a comment",
    description: "Retrieve a specific comment by id in the system",
    tags: ["Comments"],
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
  async getCommentById(req: Request, res: Response) {
    const commentId = Number(req.params.id);
    const comment = findCommentById(commentId);
    if (!comment)
      return sendError(res, "Comment not found", HttpStatus.NOT_FOUND);
    return sendResponse(res, comment);
  }
  @Patch("/:id", {
    summary: "Update a comment",
    description: "Update a specific comment in the system",
    tags: ["Comments"],
    requestExamples: [
      {
        summary: "Update comment",
        description: "Example request to update only the post title",
        value: {
          id: 1,
          body: "Updated comment",
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
        field: "body",
        required: true,
        type: "string",
      },
    ],
  })
  @LogRequest()
  async updateComment(req: Request, res: Response) {
    if (Number(req.params.id) !== Number(req.body.id))
      return sendError(
        res,
        "Resource to update not found",
        HttpStatus.BAD_REQUEST
      );
    const updatedComment = updateCommentById(Number(req.params.id), req.body);
    return sendResponse(res, updatedComment);
  }
  @Delete("/:id", {
    summary: "Delete a comment",
    description: "Delete a specific comment in the system",
    tags: ["Comments"],
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
  async deleteComment(req: Request, res: Response) {
    const commentId = Number(req.params.id);
    const comment = findCommentById(commentId);
    if (!comment)
      return sendError(res, "Comment not found", HttpStatus.NOT_FOUND);
    const deletedComment = deleteCommentById(commentId);
    return sendResponse(res, deletedComment);
  }
}

const commentController = new CommentController();
export const getComments = commentController.getComments;
export const addComment = commentController.addComment;
export const getCommentById = commentController.getCommentById;
export const updateComment = commentController.updateComment;
export const deleteComment = commentController.deleteComment;
export { CommentController };
