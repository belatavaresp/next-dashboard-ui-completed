import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const activitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Cover image: a /public path for seeded activities, or an external URL. */
    cover: { type: String, default: "" },
    guide: { type: String, default: "" },
    activityBook: { type: String, default: "" },
    extra: { type: String, default: "" },
    /** Teacher support content; stripped from responses served to students. */
    teacherGuide: { type: String, default: "" },
    classes: [{ type: Schema.Types.ObjectId, ref: "Class" }],
    /** Integer id from the hardcoded activitiesData.ts, kept so old URLs redirect. */
    legacyId: { type: Number, index: true, sparse: true },
  },
  { timestamps: true, collection: "activities" }
);

export type ActivityDoc = InferSchemaType<typeof activitySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ActivityModel: Model<ActivityDoc> =
  (mongoose.models.Activity as Model<ActivityDoc>) ||
  mongoose.model<ActivityDoc>("Activity", activitySchema);
