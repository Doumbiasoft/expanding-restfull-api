import { Router } from "express";
import userRoutes from "./user.routes";
import postRoutes from "./post.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/posts", postRoutes);

export default router;
