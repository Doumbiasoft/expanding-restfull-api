import { Router } from "express";
import {
  addComment,
  deleteComment,
  getCommentById,
  getComments,
  updateComment,
} from "../controllers/comment.controller";

const router = Router();

router.get("/", getComments);
router.post("/", addComment);
router.get("/:id", getCommentById);
router.patch("/:id", updateComment);
router.delete("/:id", deleteComment);

export default router;
