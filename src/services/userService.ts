import createHttpError from "http-errors";

import { UserCollection, type User, type UserDocument } from "../database/models/user.js";

export const createUser = (userData: User) => {
  return UserCollection.create(userData);
};

export const getUserByCognito = async (cognitoSub: string): Promise<UserDocument> => {
  const user = await UserCollection.findOne({ cognitoSub });

  if (!user) {
    throw new Error("User not found!");
  }

  return user;
};

export const addAwardToUser = async (userId: string, awardId: string) => {
  console.log(userId);
  
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
