import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { STATUSES } from "@/lib/types";

const classSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /**
     * Grade label as used by the legacy URLs ("3", "6", "10"). Kept as a string
     * because it is part of the /student-N compatibility mapping.
     */
    grade: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    status: { type: String, enum: STATUSES, default: "active" },
  },
  { timestamps: true, collection: "classes" }
);

classSchema.index({ institution: 1, grade: 1 }, { unique: true });

export type ClassDoc = InferSchemaType<typeof classSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ClassModel: Model<ClassDoc> =
  (mongoose.models.Class as Model<ClassDoc>) ||
  mongoose.model<ClassDoc>("Class", classSchema);
