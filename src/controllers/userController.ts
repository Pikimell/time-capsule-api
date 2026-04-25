import { RequestHandler } from "express";
import { Types } from "mongoose";
import createHttpError from "http-errors";

import { addAwardToUser, getUserById, updateUserProfile } from "../services/userService.js";

export const getUserByIdController: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw createHttpError(400, "Invalid user id");
    }

    const user = await getUserById(userId);

    res.status(200).json(user.toJSON());
  } catch (err) {
    next(err);
  }
};

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

export const updateUserController: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { nickname, name } = req.body as { nickname?: string; name?: string };

    if (!req.user) {
      throw createHttpError(401, "Unauthorized");
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw createHttpError(400, "Invalid user id");
    }

    if (req.user.id !== userId) {
      throw createHttpError(403, "Forbidden");
    }

    if (!nickname || typeof nickname !== "string") {
      throw createHttpError(400, "nickname is required");
    }

    if (typeof name !== "undefined" && typeof name !== "string") {
      throw createHttpError(400, "name must be a string");
    }

    const updatedUser = await updateUserProfile(userId, { nickname, name });

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};
