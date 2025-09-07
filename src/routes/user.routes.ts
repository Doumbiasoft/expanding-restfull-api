import { Router } from "express";
import {
  addUser,
  deleteUser,
  getUserById,
  getUserPosts,
  getUsers,
  updateUser,
} from "../controllers/user.controller";

const router = Router();

router.get("/", getUsers);
router.post("/", addUser);
router.get("/:id", getUserById);
router.get("/:id/posts", getUserPosts);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
