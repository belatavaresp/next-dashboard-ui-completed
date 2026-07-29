import { handleRoute } from "@/lib/http";
import { requireRole, requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ActivityModel } from "@/models/Activity";
import { ClassModel } from "@/models/Class";
import { serializeActivity } from "@/lib/serialize";
import { activitySchema } from "@/lib/validations";
import { canSeeTeacherContent } from "@/lib/queries";
import { isValidObjectId } from "mongoose";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const session = await requireSession();
    await connectToDatabase();

    const classId = new URL(request.url).searchParams.get("classId");

    // Non-admins only ever see activities from their own classes.
    const scope =
      session.role === "admin"
        ? {}
        : {
            classes: {
              $in: session.classes.map((entry) => entry.id).filter(isValidObjectId),
            },
          };

    const filter =
      classId && isValidObjectId(classId)
        ? { ...scope, classes: classId }
        : scope;

    const activities = await ActivityModel.find(filter)
      .sort({ legacyId: 1, name: 1 })
      .populate({ path: "classes", model: ClassModel });

    return {
      activities: activities.map((doc) =>
        serializeActivity(doc.toObject(), {
          includeTeacherContent: canSeeTeacherContent(session),
        })
      ),
    };
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    await requireRole("admin");
    const payload = activitySchema.parse(await request.json());
    await connectToDatabase();

    const created = await ActivityModel.create(payload);
    await created.populate({ path: "classes", model: ClassModel });

    return {
      activity: serializeActivity(created.toObject(), { includeTeacherContent: true }),
    };
  });
}
