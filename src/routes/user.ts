import { Router } from "express";

import { addAwardController } from "../controllers/userController.js";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";

const router = Router();

router.post("/:userId/awards", ctrlWrapper(addAwardController));

export default router;
