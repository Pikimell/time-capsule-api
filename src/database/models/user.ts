import { HydratedDocument, InferSchemaType, model, Schema } from "mongoose";

const userSchema = new Schema(
  {
    cognitoSub: {
      type: String,
      required: true,
      unique: true,
    },
    nickname: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: false,
      default: "Noname",
    },
    avatar: {
      type: String,
      required: false,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
  }
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;

userSchema.methods.toJSON = function (this: UserDocument) {
  const { password, ...rest } = this.toObject();
  return rest;
};

export const UserCollection = model<User>("users", userSchema);
