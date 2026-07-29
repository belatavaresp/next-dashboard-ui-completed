import { notFound, redirect } from "next/navigation";
import ActivityGrid from "@/components/ActivityGrid";
import { getSession } from "@/lib/auth";
import { getClassForSession, listActivitiesForClass } from "@/lib/queries";

type ClassPageProps = { params: Promise<{ classId: string }> };

export default async function ClassPage({ params }: ClassPageProps) {
  const { classId } = await params;

  const session = await getSession();
  if (!session) redirect("/");

  const classDoc = await getClassForSession(session, classId);
  if (!classDoc) notFound();

  /**
   * Every role sees the same activity grid here. Teacher support material and the
   * student roster belong to the admin management pages, and teachers still reach
   * each guide from the activity page itself.
   */
  const activities = await listActivitiesForClass(classId);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 mt-16">
      {/* TITLE */}
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        {classDoc.name}
      </h1>

      {/* ACTIVITY GRID */}
      <div className="w-full flex items-center justify-center">
        <ActivityGrid activities={activities} />
      </div>
    </div>
  );
}
