import { createHmac } from "node:crypto";
import createHttpError from "http-errors";

type TokenType = "access" | "refresh";

type JwtPayload = {
  sub: string;
  type: TokenType;
  iat: number;
  exp: number;
};

const encode = (value: string) => Buffer.from(value).toString("base64url");

const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const signPart = (value: string, secret: string) =>
  createHmac("sha256", secret).update(value).digest("base64url");

const parsePayload = (token: string): JwtPayload => {
  try {
    return JSON.parse(decode(token.split(".")[1] ?? "")) as JwtPayload;
  } catch {
    throw createHttpError(401, "Invalid token");
  }
};

export const signJwt = ({
  sub,
  type,
  secret,
  expiresInMs,
}: {
  sub: string;
  type: TokenType;
  secret: string;
  expiresInMs: number;
}) => {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub,
    type,
    iat: now,
    exp: now + Math.floor(expiresInMs / 1000),
  };

  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = encode(JSON.stringify(payload));
  const signature = signPart(`${header}.${body}`, secret);

  return `${header}.${body}.${signature}`;
};

export const verifyJwt = ({
  token,
  secret,
  expectedType,
}: {
  token: string;
  secret: string;
  expectedType: TokenType;
}) => {
  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) {
    throw createHttpError(401, "Invalid token");
  }

  const expectedSignature = signPart(`${header}.${payload}`, secret);

  if (signature !== expectedSignature) {
    throw createHttpError(401, "Invalid token signature");
  }

  const parsedPayload = parsePayload(token);

  if (parsedPayload.type !== expectedType) {
    throw createHttpError(401, "Invalid token type");
  }

  if (parsedPayload.exp <= Math.floor(Date.now() / 1000)) {
    throw createHttpError(401, "Token expired");
  }

  return parsedPayload;
};
