/**
 * Read-only sanity report on the migrated data. Handy after running the
 * migration scripts against a real cluster.
 *
 *   npx tsx scripts/inspect-data.ts
 */
import mongoose from "mongoose";
import { loadEnv } from "./script-utils";

loadEnv();

import { connectToDatabase } from "../src/lib/mongodb";
import { UserModel } from "../src/models/User";
import { ClassModel } from "../src/models/Class";
import { ActivityModel } from "../src/models/Activity";

async function main() {
  await connectToDatabase();

  const [users, classes, activities] = await Promise.all([
    UserModel.countDocuments(),
    ClassModel.countDocuments(),
    ActivityModel.countDocuments(),
  ]);
  console.log(`users=${users} classes=${classes} activities=${activities}`);

  console.log("\nby role:");
  for (const role of ["student", "teacher", "admin"]) {
    console.log(`  ${role.padEnd(8)} ${await UserModel.countDocuments({ role })}`);
  }

  console.log("\nusers (hash must not be selected by default):");
  const userDocs = await UserModel.find()
    .sort({ username: 1 })
    .populate({ path: "classes", model: ClassModel });
  for (const doc of userDocs) {
    const obj = doc.toObject() as unknown as Record<string, unknown> & {
      username: string;
      role: string;
      status: string;
      classes: { name: string; institution: string }[];
    };
    const classList =
      obj.classes.map((c) => `${c.name} (${c.institution})`).join(", ") || "-";
    console.log(
      `  ${obj.username.padEnd(22)} ${obj.role.padEnd(8)} ${obj.status.padEnd(8)} hashExposed=${
        "password" in obj
      }  ${classList}`
    );
  }

  console.log("\nclasses:");
  for (const doc of await ClassModel.find().sort({ institution: 1, grade: 1 })) {
    const [activityCount, memberCount] = await Promise.all([
      ActivityModel.countDocuments({ classes: doc._id }),
      UserModel.countDocuments({ classes: doc._id }),
    ]);
    console.log(
      `  ${`${doc.institution}/${doc.grade}`.padEnd(10)} ${String(activityCount).padStart(3)} atividades  ${memberCount} usuários  ${doc.status}  "${doc.name}"`
    );
  }

  const orphans = await ActivityModel.countDocuments({ classes: { $size: 0 } });
  const withLegacy = await ActivityModel.countDocuments({ legacyId: { $exists: true } });
  console.log(`\nactivities with no class: ${orphans}`);
  console.log(`legacyId coverage: ${withLegacy}/${activities}`);

  const sample = await ActivityModel.findOne({ legacyId: 3 });
  console.log("\nsample (legacyId=3):", {
    name: sample?.name,
    cover: sample?.cover,
    activityBook: sample?.activityBook?.slice(0, 50),
    hasGuide: Boolean(sample?.guide),
    extra: sample?.extra,
    teacherGuide: sample?.teacherGuide || "(empty)",
  });

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
