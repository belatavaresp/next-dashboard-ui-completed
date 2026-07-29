import { handleRoute } from "@/lib/http";
import { HttpError, requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { ClassModel } from "@/models/Class";
import { serializeUser } from "@/lib/serialize";
import { statusSchema } from "@/lib/validations";

/**
 * Status-only update, so the admin list can toggle a user without resending the
 * whole record (and without risking an unintended change to another field).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const session = await requireRole("admin");
    const { id } = await params;
    const { status } = statusSchema.parse(await request.json());

    // Deactivating yourself would lock you out at the next sign-in.
    if (session.sub === id && status === "inactive") {
      throw new HttpError(400, "Você não pode desativar o seu próprio usuário");
    }

    await connectToDatabase();

    const user = await UserModel.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate({ path: "classes", model: ClassModel });
    if (!user) throw new HttpError(404, "Usuário não encontrado");

    return { user: serializeUser(user.toObject()) };
  });
}
