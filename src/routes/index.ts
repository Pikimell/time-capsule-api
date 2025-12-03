import { Router } from "express";
import authRouter from "./auth.js";
import capsuleRouter from "./capsule.js";
import userRouter from "./user.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/capsules", capsuleRouter);
router.use("/users", userRouter);

export default router;
