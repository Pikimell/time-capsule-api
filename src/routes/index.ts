import { Router } from "express";
import authRouter from "./auth.js";
import capsuleRouter from "./capsule.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/capsules", capsuleRouter);

export default router;
