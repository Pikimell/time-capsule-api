import AWS from "aws-sdk";
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

import { CLIENT_ID, USER_POOL_ID } from "../helpers/constants.js";
import { createUser, getUserByCognito } from "./userService.js";
import { User } from "../database/models/user.js";

const poolData = {
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);
const cognito = new AWS.CognitoIdentityServiceProvider();

const getCognitoUser = (email: string) => {
  return new CognitoUser({
    Username: email,
    Pool: userPool,
  });
};

const getAuthDetails = (email: string, password: string) => {
  return new AuthenticationDetails({
    Username: email,
    Password: password,
  });
};

export type AuthSession = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  user?: User;
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

type ResetPasswordPayload = {
  email: string;
  code: string;
  newPassword: string;
};

type ConfirmEmailPayload = {
  email: string;
  code: string;
};

export const registerUserService = async ({
  email,
  password,
  name, avatar,
  group,
}: RegisterPayload) => {
  return new Promise<{ message: string; userSub: string }>((resolve, reject) => {
    const attributeList = [
      new CognitoUserAttribute({
        Name: "email",
        Value: email,
      }),
    ];

    const createDbUser = async (userSub: string) => {
      await createUser({
        nickname: email,
        password,
        name: name,
        avatar: avatar,
        cognitoSub: userSub,
      });
    };

    userPool.signUp(email, password, attributeList, [], (err, result) => {
      if (err || !result?.userSub) {
        return reject(err ?? new Error("Failed to register user"));
      }

      const userSub = result.userSub;

      if (group) {
        cognito
          .adminAddUserToGroup({
            UserPoolId: USER_POOL_ID,
            Username: email,
            GroupName: group,
          })
          .promise()
          .then(async () => {
            await createDbUser(userSub);
            resolve({ message: "User registered and added to group", userSub });
          })
          .catch((groupError) => {
            console.error("Помилка додавання до групи:", groupError);
            reject(groupError);
          });
      } else {
        createDbUser(userSub)
          .then(() => resolve({ message: "User registered successfully", userSub }))
          .catch(reject);
      }
    });
  });
};

export const loginService = async ({ email, password }: LoginPayload): Promise<AuthSession> => {
  return new Promise<AuthSession>((resolve, reject) => {
    getCognitoUser(email).authenticateUser(getAuthDetails(email, password), {
      onSuccess: (result) => {
        const buildSession = async () => {
          const idPayload = result.getIdToken().decodePayload?.() ?? {};
          const cognitoSub = (idPayload as { sub?: string }).sub;
          const emailFromToken = (idPayload as { email?: string }).email ?? email;

          let user: User | undefined;
          if (cognitoSub) {
            try {
              const dbUser = await getUserByCognito(cognitoSub);
              user = dbUser.toJSON();
            } catch {
              try {
                const createdUser = await createUser({
                  nickname: emailFromToken,
                  password,
                  cognitoSub,
                });
                user = createdUser.toJSON();
              } catch (createErr) {
                console.log("Failed to create user record on login", createErr);
                user = undefined;
              }
            }
          }

          resolve({
            accessToken: result.getAccessToken().getJwtToken(),
            idToken: result.getIdToken().getJwtToken(),
            refreshToken: result.getRefreshToken().getToken(),
            user,
          });
        };

        buildSession().catch((err) => {
          console.log("Login Service error", err);
          reject(err);
        });
      },
      onFailure: (err) => {
        console.log("Login Service error", err);
        reject(err);
      },
    });
  });
};

export const logoutService = async () => {
  return new Promise<{ message: string }>((resolve, reject) => {
    try {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        return resolve({ message: "User already logged out" });
      }
      currentUser.signOut();
      resolve({ message: "Logged out successfully" });
    } catch (err) {
      reject(err);
    }
  });
};

export const refreshService = async (): Promise<AuthSession> => {
  return new Promise<AuthSession>((resolve, reject) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      return reject(new Error("No user logged in"));
    }

    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        return reject(new Error("Session is invalid or expired"));
      }

      currentUser.refreshSession(
        session.getRefreshToken(),
        async (refreshErr: Error | null, newSession: CognitoUserSession | null) => {
          if (refreshErr || !newSession) {
            return reject(refreshErr ?? new Error("Failed to refresh session"));
          }
          const idPayload = newSession.getIdToken().decodePayload?.() ?? {};
          const cognitoSub = (idPayload as { sub?: string }).sub;
          let user: User | undefined;

          if (cognitoSub) {
            try {
              const dbUser = await getUserByCognito(cognitoSub);
              user = dbUser.toJSON();
            } catch {
              user = undefined;
            }
          }
          resolve({
            accessToken: newSession.getAccessToken().getJwtToken(),
            idToken: newSession.getIdToken().getJwtToken(),
            refreshToken: newSession.getRefreshToken().getToken(),
            user,
          });
        }
      );
    });
  });
};

export const requestResetEmailService = async (email: string) => {
  return new Promise<{ message: string }>((resolve, reject) => {
    const cognitoUser = getCognitoUser(email);
    cognitoUser.forgotPassword({
      onSuccess: () => resolve({ message: "Password reset email sent" }),
      onFailure: (err) => reject(err),
    });
  });
};

export const resetPasswordService = async ({ email, code, newPassword }: ResetPasswordPayload) => {
  return new Promise<{ message: string }>((resolve, reject) => {
    const cognitoUser = getCognitoUser(email);
    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => resolve({ message: "Password successfully reset" }),
      onFailure: (err) => reject(err),
    });
  });
};

export const confirmEmailService = async ({ email, code }: ConfirmEmailPayload) => {
  return new Promise<{ message: string; result: string | undefined }>((resolve, reject) => {
    const cognitoUser = getCognitoUser(email);
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve({ message: "Email successfully confirmed", result });
    });
  });
};

export const disableUserService = async (email: string) => {
  try {
    await cognito
      .adminDisableUser({
        UserPoolId: USER_POOL_ID,
        Username: email,
      })
      .promise();

    return { message: "User has been disabled successfully" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Failed to disable user: ${message}`);
  }
};

export const enableUserService = async (email: string) => {
  try {
    await cognito
      .adminEnableUser({
        UserPoolId: USER_POOL_ID,
        Username: email,
      })
      .promise();

    return { message: "User has been enabled successfully" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Failed to enable user: ${message}`);
  }
};
