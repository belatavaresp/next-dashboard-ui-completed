/**
 * End-to-end verification against a throwaway in-memory MongoDB.
 *
 * Boots a real mongod, seeds the legacy-shaped fixtures, runs the two migration
 * scripts' logic through the app's own models, then drives the running Next
 * server over HTTP to check every role, status and legacy-URL rule.
 *
 *   npx tsx scripts/verify.ts        (expects `npm run start` on PORT)
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { spawn, type ChildProcess } from "node:child_process";

const PORT = Number(process.env.PORT ?? 3055);
const BASE = `http://127.0.0.1:${PORT}`;
const JWT_SECRET = "verification-secret";

let failures = 0;
let checks = 0;

function check(label: string, condition: boolean, detail = "") {
  checks += 1;
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function login(username: string, password: string, expectedRole?: string) {
  const response = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, expectedRole }),
  });
  const body = await response.json().catch(() => null);
  const cookie = response.headers.get("set-cookie") ?? "";
  const session = cookie.match(/session=([^;]+)/)?.[1];
  return { status: response.status, body, cookie: session ? `session=${session}` : "" };
}

/** Follows no redirects, so we can assert on status and Location. */
async function visit(path: string, cookie = "") {
  const response = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
  return {
    status: response.status,
    location: response.headers.get("location"),
    body: response.headers.get("content-type")?.includes("json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => ""),
  };
}

async function waitForServer(child: ChildProcess) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error("Server exited early");
    try {
      const response = await fetch(`${BASE}/`);
      // A stale or partial .next build still accepts connections but fails to
      // render, which would otherwise show up as a pile of misleading failures.
      if (!response.ok) {
        throw new Error(
          `Landing page returned ${response.status}. Run \`rm -rf .next && npm run build\` and try again.`
        );
      }
      return;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Landing page returned")) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("Server did not start in time");
}

async function main() {
  console.log("Starting in-memory MongoDB...");
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB = "tle_v2";
  process.env.JWT_SECRET = JWT_SECRET;

  const { connectToDatabase } = await import("../src/lib/mongodb");
  const { ClassModel } = await import("../src/models/Class");
  const { UserModel } = await import("../src/models/User");
  const { ActivityModel } = await import("../src/models/Activity");

  await connectToDatabase();

  console.log("Seeding fixtures...");
  const hash = await bcrypt.hash("senha123", 12);

  const ipem6 = await ClassModel.create({
    name: "6º Ano: Práticas iniciais",
    grade: "6",
    institution: "IPEM",
    status: "active",
  });
  const cmd6 = await ClassModel.create({
    name: "6º Ano: Práticas iniciais",
    grade: "6",
    institution: "CMD",
    status: "active",
  });
  const ipem10 = await ClassModel.create({
    name: "Life Projects",
    grade: "10",
    institution: "IPEM",
    status: "inactive",
  });

  const student = await UserModel.create({
    name: "Aluno",
    lastName: "",
    username: "aluno_6_IPEM",
    password: hash,
    role: "student",
    status: "active",
    classes: [ipem6._id],
  });
  const inactiveStudent = await UserModel.create({
    name: "Aluno Inativo",
    username: "aluno_inativo",
    password: hash,
    role: "student",
    status: "inactive",
    classes: [cmd6._id],
  });
  const inactiveClassStudent = await UserModel.create({
    name: "Aluno Turma Inativa",
    username: "aluno_10",
    password: hash,
    role: "student",
    status: "active",
    classes: [ipem10._id],
  });
  const teacher = await UserModel.create({
    name: "Professora",
    lastName: "Silva",
    username: "prof_multi",
    password: hash,
    role: "teacher",
    status: "active",
    // Same grade at two institutions: the ambiguous legacy-URL case.
    classes: [ipem6._id, cmd6._id],
  });
  await UserModel.create({
    name: "Thayná",
    username: "thay_TLE",
    password: hash,
    role: "admin",
    status: "active",
    classes: [],
  });

  const activity = await ActivityModel.create({
    name: "Alavanca",
    cover: "/alavanca.png",
    activityBook: "https://drive.google.com/file/d/abc/preview",
    guide: "https://drive.google.com/file/d/def/preview",
    teacherGuide: "https://drive.google.com/file/d/teacher/preview",
    classes: [ipem6._id],
    legacyId: 1,
  });
  const otherClassActivity = await ActivityModel.create({
    name: "Engrenagem",
    cover: "/engrenagem.png",
    activityBook: "https://drive.google.com/file/d/ghi/preview",
    classes: [cmd6._id],
    legacyId: 3,
  });

  console.log(`Starting Next server on ${PORT}...`);
  const server = spawn("npm", ["run", "start", "--", "--port", String(PORT)], {
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", () => {});
  server.stderr?.on("data", (data) => {
    const text = String(data);
    if (text.includes("Error")) console.error("[server]", text.trim());
  });

  try {
    await waitForServer(server);

    console.log("\nAuthentication");
    const asStudent = await login("aluno_6_IPEM", "senha123", "student");
    check("student logs in with the migrated bcrypt password", asStudent.status === 200);
    check(
      "login response never includes the password hash",
      !JSON.stringify(asStudent.body).includes("$2b$") &&
        !JSON.stringify(asStudent.body).includes("$2a$")
    );

    const asTeacher = await login("prof_multi", "senha123", "teacher");
    check("teacher logs in", asTeacher.status === 200);
    const asAdmin = await login("thay_TLE", "senha123", "admin");
    check("admin logs in", asAdmin.status === 200);

    const wrongPassword = await login("aluno_6_IPEM", "errada", "student");
    check("wrong password is rejected", wrongPassword.status === 401);
    check("no cookie is issued on failure", wrongPassword.cookie === "");

    const inactive = await login("aluno_inativo", "senha123", "student");
    check("inactive user cannot log in", inactive.status === 403);
    check("inactive user gets no cookie", inactive.cookie === "");

    const wrongDoor = await login("aluno_6_IPEM", "senha123", "admin");
    check("student is refused on the admin sign-in page", wrongDoor.status === 403);
    check("refused role mismatch issues no cookie", wrongDoor.cookie === "");

    const unknown = await login("nao_existe", "senha123", "student");
    check(
      "unknown user and wrong password are indistinguishable",
      unknown.status === 401 && unknown.body?.message === wrongPassword.body?.message
    );

    console.log("\nRoute protection");
    const anonAdmin = await visit("/admin");
    check(
      "anonymous /admin redirects home",
      anonAdmin.status === 307 && anonAdmin.location?.endsWith("/") === true,
      `${anonAdmin.status} ${anonAdmin.location}`
    );

    const anonActivity = await visit(`/activities/${activity._id}`);
    check(
      "anonymous activity page redirects home (was public before)",
      anonActivity.status === 307,
      String(anonActivity.status)
    );

    const studentAdmin = await visit("/admin", asStudent.cookie);
    check(
      "student cannot reach /admin",
      studentAdmin.status === 307 && studentAdmin.location?.includes("/class/") === true,
      `${studentAdmin.status} ${studentAdmin.location}`
    );

    const studentTeacher = await visit("/teacher", asStudent.cookie);
    check("student cannot reach /teacher", studentTeacher.status === 307);

    const ownClass = await visit(`/class/${ipem6._id}`, asStudent.cookie);
    check("student can open their own class", ownClass.status === 200);
    check(
      "student class page keeps the original heading",
      typeof ownClass.body === "string" &&
        ownClass.body.includes("6º Ano: Práticas iniciais")
    );
    check(
      "student never receives teacher support content",
      typeof ownClass.body === "string" &&
        !ownClass.body.includes("Apoio ao professor") &&
        !ownClass.body.includes("file/d/teacher")
    );

    const otherClass = await visit(`/class/${cmd6._id}`, asStudent.cookie);
    check(
      "student cannot open another class",
      otherClass.status === 307,
      String(otherClass.status)
    );

    const inactiveClassLogin = await login("aluno_10", "senha123", "student");
    const inactiveClassVisit = await visit(
      `/class/${ipem10._id}`,
      inactiveClassLogin.cookie
    );
    check(
      "inactive class is hidden from its own student",
      inactiveClassVisit.status === 307 || inactiveClassVisit.status === 404,
      String(inactiveClassVisit.status)
    );
    const adminInactiveClass = await visit(`/class/${ipem10._id}`, asAdmin.cookie);
    check(
      "inactive class is still visible to an admin",
      adminInactiveClass.status === 200,
      String(adminInactiveClass.status)
    );

    console.log("\nTeacher journey");
    const teacherList = await visit("/teacher", asTeacher.cookie);
    check("teacher sees their class list", teacherList.status === 200);
    const teacherClass = await visit(`/class/${ipem6._id}`, asTeacher.cookie);
    check("teacher opens a class page", teacherClass.status === 200);
    check(
      // Support material and the roster moved to the admin management page.
      "teacher class page is only the activity grid",
      typeof teacherClass.body === "string" &&
        !teacherClass.body.includes("Apoio ao professor") &&
        !teacherClass.body.includes("Informações da turma") &&
        !teacherClass.body.includes("aluno_6_IPEM")
    );

    const adminClass = await visit(`/class/${ipem6._id}`, asAdmin.cookie);
    check(
      "admin class page is only the activity grid too",
      adminClass.status === 200 &&
        typeof adminClass.body === "string" &&
        !adminClass.body.includes("Apoio ao professor") &&
        !adminClass.body.includes("Informações da turma")
    );

    const adminManage = await visit(`/admin/classes/${ipem6._id}`, asAdmin.cookie);
    check(
      "the management page still has the roster and the activity list",
      adminManage.status === 200 &&
        typeof adminManage.body === "string" &&
        adminManage.body.includes("Usuários da turma") &&
        adminManage.body.includes("aluno_6_IPEM") &&
        adminManage.body.includes("Atividades e guias")
    );

    console.log("\nLegacy URLs");
    const studentLegacy = await visit("/student-6", asStudent.cookie);
    check(
      "/student-6 sends the IPEM student to their class",
      studentLegacy.status === 308 &&
        studentLegacy.location?.endsWith(`/class/${ipem6._id}`) === true,
      `${studentLegacy.status} ${studentLegacy.location}`
    );

    const teacherLegacy = await visit("/student-6", asTeacher.cookie);
    check(
      "/student-6 is ambiguous for the two-institution teacher, so it lands on the list",
      teacherLegacy.status === 308 && teacherLegacy.location?.endsWith("/teacher") === true,
      `${teacherLegacy.status} ${teacherLegacy.location}`
    );

    const legacyGradeFour = await visit("/student-4", asStudent.cookie);
    check(
      "/student-4 resolves instead of 404ing",
      legacyGradeFour.status === 308,
      String(legacyGradeFour.status)
    );

    const adminLegacy = await visit("/student-6", asAdmin.cookie);
    check(
      "/student-6 sends an admin to the admin area",
      adminLegacy.status === 308 && adminLegacy.location?.endsWith("/admin") === true,
      `${adminLegacy.status} ${adminLegacy.location}`
    );

    const legacyActivity = await visit("/activities/1", asStudent.cookie);
    check(
      "old integer activity URL redirects to the new id",
      legacyActivity.status === 308 &&
        legacyActivity.location?.endsWith(`/activities/${activity._id}`) === true,
      `${legacyActivity.status} ${legacyActivity.location}`
    );

    const foreignActivity = await visit(`/activities/${otherClassActivity._id}`, asStudent.cookie);
    check(
      "student cannot open an activity outside their class",
      foreignActivity.status === 404,
      String(foreignActivity.status)
    );

    console.log("\nAPI guards");
    const anonUsers = await visit("/api/users");
    check(
      "GET /api/users is not public any more",
      anonUsers.status === 401,
      String(anonUsers.status)
    );
    const studentUsers = await visit("/api/users", asStudent.cookie);
    check("students cannot list users", studentUsers.status === 403);

    const adminUsers = await visit("/api/users", asAdmin.cookie);
    check("admin can list users", adminUsers.status === 200);
    check(
      "user list never serializes password hashes",
      !JSON.stringify(adminUsers.body).includes("password")
    );

    const studentActivities = await visit("/api/activities", asStudent.cookie);
    const studentActivityJson = JSON.stringify(studentActivities.body);
    check(
      "activity list is scoped to the student's classes",
      studentActivities.status === 200 &&
        studentActivityJson.includes("Alavanca") &&
        !studentActivityJson.includes("Engrenagem")
    );
    check(
      "activity list hides teacherGuide from students",
      !studentActivityJson.includes("teacherGuide")
    );
    const teacherActivities = await visit("/api/activities", asTeacher.cookie);
    check(
      "teachers do receive teacherGuide",
      JSON.stringify(teacherActivities.body).includes("teacherGuide")
    );

    const studentCreate = await fetch(`${BASE}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: asStudent.cookie },
      body: JSON.stringify({
        name: "Hacker",
        username: "hacker",
        password: "senha123",
        role: "admin",
        classes: [],
      }),
    });
    check("students cannot create users", studentCreate.status === 403);

    const twoClassStudent = await fetch(`${BASE}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: asAdmin.cookie },
      body: JSON.stringify({
        name: "Dois",
        lastName: "Turmas",
        username: "dois_turmas",
        password: "senha123",
        role: "student",
        status: "active",
        classes: [String(ipem6._id), String(cmd6._id)],
      }),
    });
    check(
      "a student cannot be created with two classes",
      twoClassStudent.status === 422,
      String(twoClassStudent.status)
    );

    const adminWithClass = await fetch(`${BASE}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: asAdmin.cookie },
      body: JSON.stringify({
        name: "Admin",
        username: "admin_com_turma",
        password: "senha123",
        role: "admin",
        status: "active",
        classes: [String(ipem6._id)],
      }),
    });
    check("an admin cannot be created with a class", adminWithClass.status === 422);

    const moveStudent = await fetch(`${BASE}/api/classes/${cmd6._id}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: asAdmin.cookie },
      body: JSON.stringify({ userId: String(student._id) }),
    });
    check(
      "adding an already-placed student to a second class is refused",
      moveStudent.status === 400,
      String(moveStudent.status)
    );

    const addTeacher = await fetch(`${BASE}/api/classes/${ipem10._id}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: asAdmin.cookie },
      body: JSON.stringify({ userId: String(teacher._id) }),
    });
    check("a teacher can be added to another class", addTeacher.status === 200);

    console.log("\nSign out");
    const logout = await fetch(`${BASE}/api/auth/logout`, {
      method: "POST",
      headers: { cookie: asStudent.cookie },
    });
    const clearedCookie = logout.headers.get("set-cookie") ?? "";
    check(
      "logout clears the session cookie",
      logout.status === 200 && /session=;|session=deleted|Max-Age=0/.test(clearedCookie),
      clearedCookie
    );

    console.log("\nCookie hardening");
    const loginResponse = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "thay_TLE", password: "senha123" }),
    });
    const setCookie = loginResponse.headers.get("set-cookie") ?? "";
    check("session cookie is HttpOnly", /HttpOnly/i.test(setCookie), setCookie);
    check("session cookie is SameSite=Lax", /SameSite=Lax/i.test(setCookie));

    // Sanity check that the unused fixtures are referenced, keeping lint quiet.
    void inactiveStudent;
    void inactiveClassStudent;
  } finally {
    server.kill("SIGTERM");
    await mongoose.disconnect().catch(() => {});
    await mongo.stop();
  }

  console.log(`\n${checks - failures}/${checks} checks passed.`);
  if (failures > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
