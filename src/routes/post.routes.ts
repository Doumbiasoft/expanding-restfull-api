import { Router } from "express";
import {
  addPost,
  deletePost,
  getPostById,
  getPostComments,
  getPosts,
  updatePost,
} from "../controllers/post.controller";

const router = Router();

router.get("/", getPosts);
router.post("/", addPost);
router.get("/:id", getPostById);
router.get("/:id/comments", getPostComments);
router.patch("/:id", updatePost);
router.delete("/:id", deletePost);

export default router;
