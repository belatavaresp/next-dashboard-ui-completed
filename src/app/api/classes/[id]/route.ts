import { handleRoute } from "@/lib/http";
import { HttpError, requireRole, requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ClassModel } from "@/models/Class";
import { UserModel } from "@/models/User";
import { ActivityModel } from "@/models/Activity";
import { serializeClass } from "@/lib/serialize";
import { classSchema } from "@/lib/validations";
import {
  canSeeTeacherContent,
  getClassForSession,
  listActivitiesForClass,
  listClassMembers,
} from "@/lib/queries";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const session = await requireSession();
    const { id } = await params;

    const classDoc = await getClassForSession(session, id);
    if (!classDoc) throw new HttpError(404, "Turma não encontrada");

    const [users, activities] = await Promise.all([
      listClassMembers(id),
      listActivitiesForClass(id, {
        includeTeacherContent: canSeeTeacherContent(session),
      }),
    ]);

    return { class: { ...classDoc, users, activities } };
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const payload = classSchema.parse(await request.json());
    await connectToDatabase();

    const updated = await ClassModel.findByIdAndUpdate(
      id,
      {
        name: payload.name,
        grade: payload.grade,
        institution: payload.institution,
        status: payload.status,
      },
      { new: true, runValidators: true }
    );
    if (!updated) throw new HttpError(404, "Turma não encontrada");

    return { class: serializeClass(updated.toObject()) };
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    await connectToDatabase();

    const deleted = await ClassModel.findByIdAndDelete(id);
    if (!deleted) throw new HttpError(404, "Turma não encontrada");

    // Membership lives on the child documents, so clean both sides up here.
    await Promise.all([
      UserModel.updateMany({ classes: id }, { $pull: { classes: id } }),
      ActivityModel.updateMany({ classes: id }, { $pull: { classes: id } }),
    ]);

    return { ok: true };
  });
}
