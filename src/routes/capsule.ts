import { Router } from "express";

import * as capsuleControllers from "../controllers/capsuleController.js";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";

const router = Router();

router.get("/", ctrlWrapper(capsuleControllers.getCapsulesController));
router.get("/:capsuleId", ctrlWrapper(capsuleControllers.getCapsuleByIdController));
router.post("/", ctrlWrapper(capsuleControllers.createCapsuleController));
router.patch("/:capsuleId", ctrlWrapper(capsuleControllers.updateCapsuleController));
router.delete("/:capsuleId", ctrlWrapper(capsuleControllers.deleteCapsuleController));

export default router;
