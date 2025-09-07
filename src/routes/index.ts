import { Router } from "express";
import userRoutes from "./user.routes";
import postRoutes from "./post.routes";
import commentRoutes from "./comment.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRoutes);

export default router;
