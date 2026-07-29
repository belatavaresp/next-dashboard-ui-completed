import { handleRoute } from "@/lib/http";
import { HttpError, requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ClassModel } from "@/models/Class";
import { serializeClass } from "@/lib/serialize";
import { statusSchema } from "@/lib/validations";

/** Status-only counterpart to PATCH /api/classes/[id], used by the list toggle. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const { status } = statusSchema.parse(await request.json());

    await connectToDatabase();

    const updated = await ClassModel.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!updated) throw new HttpError(404, "Turma não encontrada");

    return { class: serializeClass(updated.toObject()) };
  });
}
