import createHttpError from "http-errors";

import { SessionCollection } from "../database/models/session.js";
import { User, UserCollection } from "../database/models/user.js";
import {
  ACCESS_TOKEN_SECRET,
  ONE_DAY,
  ONE_MONTH,
  REFRESH_TOKEN_SECRET,
} from "../helpers/constants.js";
import {
  createUser,
  getUserByEmail,
  getUserById,
  isPasswordValid,
} from "./userService.js";
import { signJwt, verifyJwt } from "../utils/jwt.js";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, "password">;
};

type RegisterPayload = {
  email: string;
  password: string;
  group?: string;
  name?: string;
  avatar?: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

const createTokens = (userId: string) => ({
  accessToken: signJwt({
    sub: userId,
    type: "access",
    secret: ACCESS_TOKEN_SECRET,
    expiresInMs: ONE_DAY,
  }),
  refreshToken: signJwt({
    sub: userId,
    type: "refresh",
    secret: REFRESH_TOKEN_SECRET,
    expiresInMs: ONE_MONTH,
  }),
});

const buildSession = async (userId: string): Promise<AuthSession> => {
  const user = await getUserById(userId);
  const { accessToken, refreshToken } = createTokens(user.id);

  await SessionCollection.deleteMany({ userId: user._id });
  await SessionCollection.create({
    userId: user._id,
    accessToken,
    refreshToken,
  });

  return {
    accessToken,
    refreshToken,
    user: user.toJSON(),
  };
};

export const registerUserService = async ({
  email,
  password,
  name,
  avatar,
}: RegisterPayload) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await UserCollection.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw createHttpError(409, "User with this email already exists");
  }

  const nextUser = await createUser({
    email: normalizedEmail,
    password,
    name,
    avatar,
    nickname: normalizedEmail,
    awards: [],
  });

  return {
    message: "User registered successfully",
    userId: nextUser.id,
  };
};

export const loginService = async ({ email, password }: LoginPayload): Promise<AuthSession> => {
  const user = await getUserByEmail(email);
  const isValid = isPasswordValid(password, user.password);

  if (!isValid) {
    throw createHttpError(401, "Email or password is incorrect");
  }

  return buildSession(user.id);
};

export const logoutService = async ({
  refreshToken,
  accessToken,
}: {
  refreshToken?: string;
  accessToken?: string;
}) => {
  if (!refreshToken && !accessToken) {
    return { message: "User already logged out" };
  }

  await SessionCollection.deleteMany({
    $or: [
      ...(refreshToken ? [{ refreshToken }] : []),
      ...(accessToken ? [{ accessToken }] : []),
    ],
  });

  return { message: "Logged out successfully" };
};

export const refreshService = async (refreshToken: string): Promise<AuthSession> => {
  const payload = verifyJwt({
    token: refreshToken,
    secret: REFRESH_TOKEN_SECRET,
    expectedType: "refresh",
  });

  const session = await SessionCollection.findOne({
    refreshToken,
    userId: payload.sub,
  });

  if (!session) {
    throw createHttpError(401, "Session not found");
  }

  return buildSession(payload.sub);
};

export const getUserFromAccessToken = async (accessToken: string) => {
  const payload = verifyJwt({
    token: accessToken,
    secret: ACCESS_TOKEN_SECRET,
    expectedType: "access",
  });

  const session = await SessionCollection.findOne({
    accessToken,
    userId: payload.sub,
  });

  if (!session) {
    throw createHttpError(401, "Session not found");
  }

  return getUserById(payload.sub);
};
