import { Router } from "express";
import {
  addUsers,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/user.controller";

const router = Router();

router.get("/", getUsers);
router.post("/", addUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
