import { HydratedDocument, InferSchemaType, model, Schema } from "mongoose";

const capsuleSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    location: {
      lat: {
        type: Number,
        required: true,
      },
      lon: {
        type: Number,
        required: true,
      },
      country: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      }
    },
    timeToOpen: {
      type: Date,
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    media: {
      type: [String],
      default: [],
    },
    files: {
      type: [String],
      default: [],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export type Capsule = InferSchemaType<typeof capsuleSchema>;
export type CapsuleDocument = HydratedDocument<Capsule>;

export const CapsuleCollection = model<Capsule>("capsules", capsuleSchema);
