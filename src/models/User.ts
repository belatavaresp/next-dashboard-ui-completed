import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ROLES, STATUSES } from "@/lib/types";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    lastName: { type: String, default: "", trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    /** bcrypt hash; carried over verbatim from the legacy database. */
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    status: { type: String, enum: STATUSES, default: "active" },
    classes: [{ type: Schema.Types.ObjectId, ref: "Class" }],
  },
  { timestamps: true, collection: "users" }
);

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", userSchema);
