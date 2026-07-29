import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { ClassModel } from "@/models/Class";
import { loginSchema } from "@/lib/validations";
import { serializeUser } from "@/lib/serialize";
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/session";

const INVALID_CREDENTIALS = "Credenciais inválidas. Tente novamente.";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: INVALID_CREDENTIALS }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: INVALID_CREDENTIALS }, { status: 400 });
  }

  await connectToDatabase();

  const user = await UserModel.findOne({ username: parsed.data.username })
    .select("+password")
    .populate({ path: "classes", model: ClassModel });

  // Same response for unknown user and wrong password, so the endpoint cannot be
  // used to enumerate usernames.
  if (!user) {
    return NextResponse.json({ message: INVALID_CREDENTIALS }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.password);
  if (!passwordMatches) {
    return NextResponse.json({ message: INVALID_CREDENTIALS }, { status: 401 });
  }

  if (parsed.data.expectedRole && user.role !== parsed.data.expectedRole) {
    return NextResponse.json(
      { message: "Acesso negado. Você não tem permissão para acessar esta página." },
      { status: 403 }
    );
  }

  if (user.status === "inactive") {
    return NextResponse.json(
      { message: "Este usuário está inativo. Fale com a administração." },
      { status: 403 }
    );
  }

  const publicUser = serializeUser(user.toObject());
  const activeClasses = publicUser.classes.filter((entry) => entry.status === "active");

  const token = await signSession({
    sub: publicUser.id,
    username: publicUser.username,
    name: publicUser.name,
    role: publicUser.role,
    // Grade travels in the token so middleware can map legacy /student-N URLs
    // without a database call on the Edge runtime.
    classes: activeClasses.map((entry) => ({ id: entry.id, grade: entry.grade })),
  });

  const response = NextResponse.json({ user: publicUser });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  response.cookies.delete(LEGACY_SESSION_COOKIE);
  return response;
}
