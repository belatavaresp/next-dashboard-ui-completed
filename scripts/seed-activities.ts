/**
 * Imports the 58 hardcoded activities from src/lib/activitiesData.ts into the
 * database, linking each one to every class that shares its grade. The original
 * integer id is kept as legacyId so old /activities/{id} URLs still resolve.
 *
 * Safe to re-run: activities are upserted by legacyId.
 *
 *   npm run seed:activities
 */
import mongoose from "mongoose";
import { loadEnv, classTitleForGrade } from "./script-utils";

loadEnv();

import { connectToDatabase } from "../src/lib/mongodb";
import { ClassModel } from "../src/models/Class";
import { ActivityModel } from "../src/models/Activity";
import { activitiesData } from "../src/lib/activitiesData";

type LegacyActivity = {
  id: number;
  name: string;
  image: string;
  class: number;
  pdfLinks: { content: string; guide?: string; extra?: string };
};

async function main() {
  await connectToDatabase();

  const activities = activitiesData as LegacyActivity[];
  const grades = [...new Set(activities.map((a) => String(a.class)))];

  // A grade may exist at several institutions; an activity links to all of them,
  // which is the many-to-many rule from the definition.
  const classesByGrade = new Map<string, mongoose.Types.ObjectId[]>();
  for (const grade of grades) {
    const docs = await ClassModel.find({ grade }).select("_id institution");
    classesByGrade.set(
      grade,
      docs.map((doc) => doc._id)
    );
    if (docs.length === 0) {
      console.warn(
        `  no class exists for grade ${grade} ("${classTitleForGrade(grade)}"); its activities will be unlinked`
      );
    }
  }

  let created = 0;
  let updated = 0;

  for (const legacy of activities) {
    const grade = String(legacy.class);
    const existing = await ActivityModel.findOne({ legacyId: legacy.id });

    await ActivityModel.findOneAndUpdate(
      { legacyId: legacy.id },
      {
        $set: {
          name: legacy.name,
          cover: legacy.image ?? "",
          activityBook: legacy.pdfLinks?.content ?? "",
          guide: legacy.pdfLinks?.guide ?? "",
          extra: legacy.pdfLinks?.extra ?? "",
          classes: classesByGrade.get(grade) ?? [],
          legacyId: legacy.id,
        },
        $setOnInsert: { teacherGuide: "" },
      },
      { upsert: true, new: true }
    );

    if (existing) updated += 1;
    else created += 1;
  }

  console.log(
    `\nSeeded ${activities.length} activities (${created} created, ${updated} updated).`
  );
  for (const grade of grades.sort((a, b) => Number(a) - Number(b))) {
    const count = activities.filter((a) => String(a.class) === grade).length;
    const linked = classesByGrade.get(grade)?.length ?? 0;
    console.log(`  grade ${grade}: ${count} activities -> ${linked} class(es)`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
