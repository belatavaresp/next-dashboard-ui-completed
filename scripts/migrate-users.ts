/**
 * Copies the legacy users into the new tle_v2 schema and creates one Class per
 * (institution, grade) pair found in the legacy data.
 *
 * Source of truth is either the legacy database on the same cluster
 * (LEGACY_MONGODB_DB) or, if that name is unknown, the still-running legacy API
 * (LEGACY_API_URL). bcrypt hashes are copied verbatim so existing passwords
 * keep working. Safe to re-run: everything is upserted.
 *
 *   npm run migrate:users
 */
import mongoose from "mongoose";
import { loadEnv, classTitleForGrade } from "./script-utils";

loadEnv();

import { connectToDatabase } from "../src/lib/mongodb";
import { ClassModel } from "../src/models/Class";
import { UserModel } from "../src/models/User";
import { LEGACY_ROLE_MAP, type Role } from "../src/lib/types";

type LegacyUser = {
  name?: string;
  nickname?: string;
  password?: string;
  institution?: string;
  Class?: string[];
  role?: number;
};

const LEGACY_API_URL =
  process.env.LEGACY_API_URL ??
  "https://tle-api.vercel.app/api/user/listAllUsers";

async function readLegacyUsers(): Promise<LegacyUser[]> {
  const legacyDb = process.env.LEGACY_MONGODB_DB;

  if (legacyDb) {
    console.log(`Reading legacy users from database "${legacyDb}"...`);
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set.");
    const connection = await mongoose.createConnection(uri, { dbName: legacyDb }).asPromise();
    const docs = await connection.collection("users").find({}).toArray();
    await connection.close();
    return docs as LegacyUser[];
  }

  console.log(`Reading legacy users from ${LEGACY_API_URL}...`);
  const response = await fetch(LEGACY_API_URL);
  if (!response.ok) {
    throw new Error(`Legacy API returned ${response.status}`);
  }
  const body = (await response.json()) as { users?: LegacyUser[] };
  return body.users ?? [];
}

async function main() {
  const legacyUsers = await readLegacyUsers();
  console.log(`Found ${legacyUsers.length} legacy users.`);

  await connectToDatabase();

  // Every (institution, grade) pair becomes its own class, so IPEM's 6th grade
  // and CMD's 6th grade stay separate.
  const pairs = new Map<string, { institution: string; grade: string }>();
  for (const user of legacyUsers) {
    const institution = (user.institution ?? "").trim();
    if (!institution) continue;
    for (const grade of user.Class ?? []) {
      const key = `${institution}::${grade}`;
      if (!pairs.has(key)) pairs.set(key, { institution, grade: String(grade) });
    }
  }

  const classIdByKey = new Map<string, mongoose.Types.ObjectId>();
  for (const [key, { institution, grade }] of pairs) {
    const doc = await ClassModel.findOneAndUpdate(
      { institution, grade },
      {
        $setOnInsert: {
          name: classTitleForGrade(grade),
          institution,
          grade,
          status: "active",
        },
      },
      { upsert: true, new: true }
    );
    classIdByKey.set(key, doc._id);
    console.log(`  class ${institution} / ${grade} -> ${doc.name}`);
  }

  let migrated = 0;
  const warnings: string[] = [];

  for (const legacy of legacyUsers) {
    const username = (legacy.nickname ?? "").trim();
    if (!username) {
      warnings.push(`Skipped a user with no nickname (name: ${legacy.name ?? "?"}).`);
      continue;
    }
    if (!legacy.password) {
      warnings.push(`Skipped ${username}: no password hash in the legacy record.`);
      continue;
    }

    const role: Role = LEGACY_ROLE_MAP[legacy.role ?? 0] ?? "student";
    const institution = (legacy.institution ?? "").trim();

    let classIds = (legacy.Class ?? [])
      .map((grade) => classIdByKey.get(`${institution}::${grade}`))
      .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

    if (role === "admin") {
      classIds = [];
    } else if (role === "student" && classIds.length > 1) {
      warnings.push(
        `${username} had ${classIds.length} classes; kept the first one (students take exactly one).`
      );
      classIds = classIds.slice(0, 1);
    } else if (role === "student" && classIds.length === 0) {
      warnings.push(`${username} is a student with no class and will not see any content.`);
    }

    await UserModel.findOneAndUpdate(
      { username },
      {
        $set: {
          name: (legacy.name ?? username).trim(),
          username,
          role,
          classes: classIds,
        },
        // lastName is intentionally left empty rather than guessed from a split.
        $setOnInsert: {
          lastName: "",
          password: legacy.password,
          status: "active",
        },
      },
      { upsert: true, new: true }
    );

    migrated += 1;
  }

  console.log(`\nMigrated ${migrated} users into ${classIdByKey.size} classes.`);
  if (warnings.length) {
    console.log("\nWarnings:");
    for (const warning of warnings) console.log(`  - ${warning}`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
