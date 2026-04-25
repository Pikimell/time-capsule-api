import { Router } from "express";

import {
  addAwardController,
  getUserByIdController,
  updateUserController,
} from "../controllers/userController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";

const router = Router();

router.get("/:userId", ctrlWrapper(getUserByIdController));
router.patch("/:userId", authenticate, ctrlWrapper(updateUserController));
router.post("/:userId/awards", ctrlWrapper(addAwardController));

export default router;
