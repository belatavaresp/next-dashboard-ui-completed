import bcrypt from "bcryptjs";
import { handleRoute } from "@/lib/http";
import { HttpError, requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { ClassModel } from "@/models/Class";
import { serializeUser } from "@/lib/serialize";
import { updateUserSchema } from "@/lib/validations";

const BCRYPT_ROUNDS = 12;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    await connectToDatabase();

    const user = await UserModel.findById(id).populate({
      path: "classes",
      model: ClassModel,
    });
    if (!user) throw new HttpError(404, "Usuário não encontrado");

    return { user: serializeUser(user.toObject()) };
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const payload = updateUserSchema.parse(await request.json());
    await connectToDatabase();

    const update: Record<string, unknown> = {
      name: payload.name,
      lastName: payload.lastName ?? "",
      username: payload.username,
      role: payload.role,
      status: payload.status,
      classes: payload.classes,
    };

    // An empty password field means "leave the current password alone".
    if (payload.password) {
      update.password = await bcrypt.hash(payload.password, BCRYPT_ROUNDS);
    }

    const user = await UserModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).populate({ path: "classes", model: ClassModel });
    if (!user) throw new HttpError(404, "Usuário não encontrado");

    return { user: serializeUser(user.toObject()) };
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    const session = await requireRole("admin");
    const { id } = await params;

    if (session.sub === id) {
      throw new HttpError(400, "Você não pode excluir o seu próprio usuário");
    }

    await connectToDatabase();
    const deleted = await UserModel.findByIdAndDelete(id);
    if (!deleted) throw new HttpError(404, "Usuário não encontrado");

    return { ok: true };
  });
}
