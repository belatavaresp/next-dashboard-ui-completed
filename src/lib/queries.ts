import { connectToDatabase } from "@/lib/mongodb";
import { ActivityModel } from "@/models/Activity";
import { ClassModel } from "@/models/Class";
import { UserModel } from "@/models/User";
import { serializeActivity, serializeClass, serializeUser } from "@/lib/serialize";
import type { PublicActivity, PublicClass, PublicUser, SessionClaims } from "@/lib/types";
import { isValidObjectId } from "mongoose";

/**
 * Shared read helpers used by both server components and route handlers, so the
 * scoping rules ("inactive classes are hidden from teachers and students",
 * "students never receive teacher content") live in exactly one place.
 */

export function canSeeTeacherContent(session: SessionClaims) {
  return session.role === "teacher" || session.role === "admin";
}

export async function listClassesForSession(
  session: SessionClaims
): Promise<PublicClass[]> {
  await connectToDatabase();

  if (session.role === "admin") {
    const classes = await ClassModel.find().sort({ institution: 1, grade: 1 });
    return classes.map((doc) => serializeClass(doc.toObject()));
  }

  const ids = session.classes.map((entry) => entry.id).filter(isValidObjectId);
  const classes = await ClassModel.find({
    _id: { $in: ids },
    status: "active",
  }).sort({ institution: 1, grade: 1 });

  return classes.map((doc) => serializeClass(doc.toObject()));
}

export async function getClassForSession(
  session: SessionClaims,
  classId: string
): Promise<PublicClass | null> {
  if (!isValidObjectId(classId)) return null;
  await connectToDatabase();

  const filter =
    session.role === "admin"
      ? { _id: classId }
      : { _id: classId, status: "active" as const };

  const doc = await ClassModel.findOne(filter);
  if (!doc) return null;

  if (session.role !== "admin") {
    const isMember = session.classes.some((entry) => entry.id === classId);
    if (!isMember) return null;
  }

  return serializeClass(doc.toObject());
}

export async function listClassMembers(classId: string): Promise<PublicUser[]> {
  await connectToDatabase();
  const users = await UserModel.find({ classes: classId }).sort({ name: 1 });
  return users.map((user) => serializeUser(user.toObject()));
}

/**
 * Resolves an activity from a URL segment that may be either a Mongo id or a
 * legacy integer id from the old hardcoded data. `matchedLegacyId` tells callers
 * to redirect to the canonical URL.
 */
export async function findActivityByIdOrLegacyId(segment: string) {
  await connectToDatabase();

  if (isValidObjectId(segment)) {
    const doc = await ActivityModel.findById(segment).populate({
      path: "classes",
      model: ClassModel,
    });
    return doc ? { doc, matchedLegacyId: false } : null;
  }

  if (/^\d+$/.test(segment)) {
    const doc = await ActivityModel.findOne({ legacyId: Number(segment) }).populate({
      path: "classes",
      model: ClassModel,
    });
    return doc ? { doc, matchedLegacyId: true } : null;
  }

  return null;
}

/** Students and teachers may only open activities belonging to their classes. */
export function canAccessActivity(
  session: SessionClaims,
  activity: { classes: PublicActivity["classes"] }
) {
  if (session.role === "admin") return true;
  const ownIds = new Set(session.classes.map((entry) => entry.id));
  return activity.classes.some(
    (entry) => ownIds.has(entry.id) && entry.status === "active"
  );
}

export async function listActivitiesForClass(
  classId: string,
  { includeTeacherContent = false } = {}
): Promise<PublicActivity[]> {
  await connectToDatabase();
  const activities = await ActivityModel.find({ classes: classId }).sort({
    legacyId: 1,
    name: 1,
  });
  return activities.map((doc) =>
    serializeActivity(doc.toObject(), { includeTeacherContent })
  );
}
