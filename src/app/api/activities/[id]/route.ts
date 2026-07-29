import { handleRoute } from "@/lib/http";
import { HttpError, requireRole, requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ActivityModel } from "@/models/Activity";
import { ClassModel } from "@/models/Class";
import { serializeActivity } from "@/lib/serialize";
import { activitySchema } from "@/lib/validations";
import {
  canAccessActivity,
  canSeeTeacherContent,
  findActivityByIdOrLegacyId,
} from "@/lib/queries";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const session = await requireSession();
    const { id } = await params;

    const found = await findActivityByIdOrLegacyId(id);
    if (!found) throw new HttpError(404, "Atividade não encontrada");

    const activity = serializeActivity(found.doc.toObject(), {
      includeTeacherContent: canSeeTeacherContent(session),
    });

    if (!canAccessActivity(session, activity)) {
      throw new HttpError(403, "Acesso negado");
    }

    return { activity };
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const payload = activitySchema.parse(await request.json());
    await connectToDatabase();

    const updated = await ActivityModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate({ path: "classes", model: ClassModel });
    if (!updated) throw new HttpError(404, "Atividade não encontrada");

    return {
      activity: serializeActivity(updated.toObject(), { includeTeacherContent: true }),
    };
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    await connectToDatabase();

    const deleted = await ActivityModel.findByIdAndDelete(id);
    if (!deleted) throw new HttpError(404, "Atividade não encontrada");

    return { ok: true };
  });
}
