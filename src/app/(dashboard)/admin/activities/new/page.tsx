import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import ActivityForm from "@/components/forms/ActivityForm";
import { FormShell } from "@/components/forms/FormShell";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ClassModel } from "@/models/Class";
import { serializeClass } from "@/lib/serialize";

type PageProps = { searchParams: Promise<{ classId?: string }> };

export default async function NewActivityPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  const { classId } = await searchParams;

  await connectToDatabase();
  const classes = await ClassModel.find().sort({ institution: 1, grade: 1 });

  // Arriving from a class page pre-selects that class and returns to it.
  const preselected = classId && isValidObjectId(classId) ? classId : undefined;
  const backHref = preselected ? `/admin/classes/${preselected}` : "/admin";

  return (
    <FormShell title="Nova atividade" backHref={backHref}>
      <ActivityForm
        classes={classes.map((doc) => serializeClass(doc.toObject()))}
        initialClassIds={preselected ? [preselected] : []}
        returnHref={backHref}
      />
    </FormShell>
  );
}
