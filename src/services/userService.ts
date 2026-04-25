import createHttpError from "http-errors";

import { UserCollection, type User, type UserDocument } from "../database/models/user.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

export const createUser = (userData: User) => {
  return UserCollection.create({
    ...userData,
    email: userData.email.toLowerCase(),
    password: hashPassword(userData.password),
  });
};

export const getUserById = async (userId: string): Promise<UserDocument> => {
  const user = await UserCollection.findById(userId);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return user;
};

export const getUserByEmail = async (email: string): Promise<UserDocument> => {
  const user = await UserCollection.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return user;
};

export const isPasswordValid = (password: string, passwordHash: string) =>
  verifyPassword(password, passwordHash);

export const addAwardToUser = async (userId: string, awardId: string) => {
  const updatedUser = await UserCollection.findByIdAndUpdate(
    userId,
    { $addToSet: { awards: awardId } },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw createHttpError(404, "User not found");
  }

  return updatedUser;
};

export const updateUserProfile = async (
  userId: string,
  { nickname, name }: { nickname: string; name?: string }
) => {
  const normalizedNickname = nickname.trim();
  const normalizedName = name?.trim() || "Noname";

  if (!normalizedNickname) {
    throw createHttpError(400, "Nickname is required");
  }

  const existingUser = await UserCollection.findOne({
    nickname: normalizedNickname,
    _id: { $ne: userId },
  });

  if (existingUser) {
    throw createHttpError(409, "Nickname is already taken");
  }

  const updatedUser = await UserCollection.findByIdAndUpdate(
    userId,
    {
      nickname: normalizedNickname,
      name: normalizedName,
    },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw createHttpError(404, "User not found");
  }

  return updatedUser;
};
