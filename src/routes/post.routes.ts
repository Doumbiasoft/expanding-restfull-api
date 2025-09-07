import { Router } from "express";
import {
  addPost,
  deletePost,
  getPostById,
  getPosts,
  updatePost,
} from "../controllers/post.controller";

const router = Router();

router.get("/", getPosts);
router.post("/", addPost);
router.get("/:id", getPostById);
router.patch("/:id", updatePost);
router.delete("/:id", deletePost);

export default router;
