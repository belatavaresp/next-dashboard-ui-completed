import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import ClassForm from "@/components/forms/ClassForm";
import ClassMembers from "@/components/admin/ClassMembers";
import ClassActivities from "@/components/admin/ClassActivities";
import { FormShell } from "@/components/forms/FormShell";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ClassModel } from "@/models/Class";
import { UserModel } from "@/models/User";
import { serializeClass, serializeUser } from "@/lib/serialize";
import { listActivitiesForClass, listClassMembers } from "@/lib/queries";

type PageProps = { params: Promise<{ id: string }> };

export default async function ClassManagementPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const classDoc = await ClassModel.findById(id);
  if (!classDoc) notFound();

  const [members, activities, candidateDocs] = await Promise.all([
    listClassMembers(id),
    listActivitiesForClass(id, { includeTeacherContent: true }),
    UserModel.find({ role: { $ne: "admin" }, classes: { $ne: id } }).sort({ name: 1 }),
  ]);

  const serializedClass = serializeClass(classDoc.toObject());

  return (
    <>
      <FormShell
        title={serializedClass.name}
        description={`${serializedClass.institution} · ${serializedClass.grade}º ano`}
        backHref="/admin"
      >
        <ClassForm classItem={serializedClass} />
      </FormShell>

      {/* Padding outside, cap inside: mirrors FormShell so the cards line up. */}
      <div className="px-4 pb-8 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          <ClassMembers
            classId={id}
            members={members}
            candidates={candidateDocs.map((doc) => serializeUser(doc.toObject()))}
          />
          <ClassActivities classId={id} activities={activities} />
        </div>
      </div>
    </>
  );
}
