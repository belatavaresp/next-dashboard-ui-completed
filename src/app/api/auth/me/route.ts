import { handleRoute } from "@/lib/http";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { ClassModel } from "@/models/Class";
import { serializeUser } from "@/lib/serialize";
import { HttpError } from "@/lib/auth";

export async function GET() {
  return handleRoute(async () => {
    const session = await requireSession();
    await connectToDatabase();

    const user = await UserModel.findById(session.sub).populate({
      path: "classes",
      model: ClassModel,
    });
    if (!user) throw new HttpError(401, "Não autenticado");

    return { user: serializeUser(user.toObject()) };
  });
}
