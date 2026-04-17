import { Router } from "express";

import * as capsuleControllers from "../controllers/capsuleController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";

const router = Router();

router.get("/", ctrlWrapper(capsuleControllers.getCapsulesController));
router.get("/:capsuleId", ctrlWrapper(capsuleControllers.getCapsuleByIdController));
router.post("/", authenticate, ctrlWrapper(capsuleControllers.createCapsuleController));
router.patch("/:capsuleId", authenticate, ctrlWrapper(capsuleControllers.updateCapsuleController));
router.delete("/:capsuleId", authenticate, ctrlWrapper(capsuleControllers.deleteCapsuleController));

export default router;
