import bcrypt from "bcryptjs";
import { handleRoute } from "@/lib/http";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { ClassModel } from "@/models/Class";
import { serializeUser } from "@/lib/serialize";
import { createUserSchema } from "@/lib/validations";

const BCRYPT_ROUNDS = 12;

export async function GET() {
  return handleRoute(async () => {
    await requireRole("admin");
    await connectToDatabase();

    const users = await UserModel.find()
      .sort({ name: 1 })
      .populate({ path: "classes", model: ClassModel });

    return { users: users.map((user) => serializeUser(user.toObject())) };
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    await requireRole("admin");
    const payload = createUserSchema.parse(await request.json());
    await connectToDatabase();

    const created = await UserModel.create({
      name: payload.name,
      lastName: payload.lastName ?? "",
      username: payload.username,
      password: await bcrypt.hash(payload.password, BCRYPT_ROUNDS),
      role: payload.role,
      status: payload.status,
      classes: payload.classes,
    });

    await created.populate({ path: "classes", model: ClassModel });
    return { user: serializeUser(created.toObject()) };
  });
}
