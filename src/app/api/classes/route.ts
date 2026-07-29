import { handleRoute } from "@/lib/http";
import { requireRole, requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ClassModel } from "@/models/Class";
import { UserModel } from "@/models/User";
import { serializeClass } from "@/lib/serialize";
import { classSchema } from "@/lib/validations";
import { listClassesForSession } from "@/lib/queries";

export async function GET() {
  return handleRoute(async () => {
    const session = await requireSession();
    return { classes: await listClassesForSession(session) };
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    await requireRole("admin");
    const payload = classSchema.parse(await request.json());
    await connectToDatabase();

    const created = await ClassModel.create({
      name: payload.name,
      grade: payload.grade,
      institution: payload.institution,
      status: payload.status,
    });

    if (payload.users.length) {
      await UserModel.updateMany(
        { _id: { $in: payload.users } },
        { $addToSet: { classes: created._id } }
      );
    }

    return { class: serializeClass(created.toObject()) };
  });
}
