import { RequestHandler } from "express";
import { Types } from "mongoose";
import createHttpError from "http-errors";

import { addAwardToUser } from "../services/userService.js";

export const addAwardController: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { awardId } = req.body as { awardId?: string };

    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw createHttpError(400, "Invalid user id");
    }

    if (!awardId || typeof awardId !== "string" || !awardId.trim()) {
      throw createHttpError(400, "awardId is required");
    }

    const updatedUser = await addAwardToUser(userId, awardId.trim());

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};
