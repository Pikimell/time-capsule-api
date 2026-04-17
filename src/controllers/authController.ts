import { Request, RequestHandler } from "express";
import createHttpError from "http-errors";

import * as authServices from "../services/authService.js";
import { ONE_DAY, ONE_MONTH } from "../helpers/constants.js";

const isLocalhostRequest = (req: Request) => {
  const host = req.header("host") ?? "";
  const origin = req.header("origin") ?? "";
  const referer = req.header("referer") ?? "";
  return /localhost/i.test(host) || /localhost/i.test(origin) || /localhost/i.test(referer);
};

const makeCookieOptions = (req: Request, maxAge: number) => ({
  httpOnly: true,
  secure: !isLocalhostRequest(req),
  sameSite: isLocalhostRequest(req) ? ("lax" as const) : ("none" as const),
  path: "/",
  maxAge,
});

export const registerUserController: RequestHandler = async (req, res, next) => {
  try {
    const { name, avatar, email, password, group } = req.body as {
      email: string;
      password: string;
      name?: string;
      avatar?: string;
      group?: string;
    };

    const result = await authServices.registerUserService({
      email,
      password,
      name, avatar,
      group,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const loginController: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const session = await authServices.loginService({ email, password });

    res.cookie("refreshToken", session.refreshToken, makeCookieOptions(req, ONE_MONTH));

    res.cookie("accessToken", session.accessToken, makeCookieOptions(req, ONE_DAY));

    res.status(200).json({ accessToken: session.accessToken, user: session.user });
  } catch (err) {
    next(err);
  }
};

export const logoutController: RequestHandler = async (req, res, next) => {
  try {
    await authServices.logoutService({
      refreshToken: req.cookies.refreshToken,
      accessToken: req.cookies.accessToken,
    });

    res.clearCookie("refreshToken", makeCookieOptions(req, 0));
    res.clearCookie("accessToken", makeCookieOptions(req, 0));

    res.status(200).json({ message: "Logged out successfully!" });
  } catch (err) {
    next(err);
  }
};

export const refreshController: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken as string | undefined;

    if (!refreshToken) {
      throw createHttpError(401, "Refresh token is required");
    }

    const session = await authServices.refreshService(refreshToken);

    res.cookie("refreshToken", session.refreshToken, makeCookieOptions(req, ONE_MONTH));

    res.cookie("accessToken", session.accessToken, makeCookieOptions(req, ONE_DAY));

    res.status(200).json({ accessToken: session.accessToken, user: session.user });
  } catch (err) {
    next(err);
  }
};

export const getMeController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw createHttpError(401, "Unauthorized");
    }

    res.status(200).json(req.user.toJSON());
  } catch (err) {
    next(err);
  }
};
