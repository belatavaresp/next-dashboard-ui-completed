import { handleRoute } from "@/lib/http";
import { HttpError, requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ClassModel } from "@/models/Class";
import { UserModel } from "@/models/User";
import { classMembersSchema } from "@/lib/validations";
import { listClassMembers } from "@/lib/queries";

type RouteContext = { params: Promise<{ id: string }> };

/** Adds a user to the class. The user's type is never changed here. */
export async function POST(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const { userId } = classMembersSchema.parse(await request.json());
    await connectToDatabase();

    const classDoc = await ClassModel.findById(id);
    if (!classDoc) throw new HttpError(404, "Turma não encontrada");

    const user = await UserModel.findById(userId);
    if (!user) throw new HttpError(404, "Usuário não encontrado");

    if (user.role === "admin") {
      throw new HttpError(400, "Administradores não pertencem a turmas");
    }
    if (user.role === "student" && user.classes.length > 0) {
      const alreadyHere = user.classes.some((entry) => String(entry) === id);
      if (!alreadyHere) {
        throw new HttpError(
          400,
          "Alunos podem pertencer a apenas uma turma. Remova o aluno da turma atual primeiro."
        );
      }
    }

    await UserModel.updateOne({ _id: userId }, { $addToSet: { classes: id } });

    return { users: await listClassMembers(id) };
  });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  return handleRoute(async () => {
    await requireRole("admin");
    const { id } = await params;
    const { userId } = classMembersSchema.parse(await request.json());
    await connectToDatabase();

    await UserModel.updateOne({ _id: userId }, { $pull: { classes: id } });

    return { users: await listClassMembers(id) };
  });
}
