import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ActivityForm from "@/components/forms/ActivityForm";
import { FormShell } from "@/components/forms/FormShell";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ClassModel } from "@/models/Class";
import { serializeActivity, serializeClass } from "@/lib/serialize";
import { findActivityByIdOrLegacyId } from "@/lib/queries";

type PageProps = { params: Promise<{ id: string }> };

export default async function ActivityManagementPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  const { id } = await params;
  const found = await findActivityByIdOrLegacyId(id);
  if (!found) notFound();

  await connectToDatabase();
  const classes = await ClassModel.find().sort({ institution: 1, grade: 1 });

  const activity = serializeActivity(found.doc.toObject(), {
    includeTeacherContent: true,
  });

  return (
    <FormShell
      title={activity.name}
      description={
        activity.classes.length
          ? `Turmas: ${activity.classes.map((entry) => entry.name).join(", ")}`
          : "Esta atividade ainda não está em nenhuma turma."
      }
      backHref="/admin"
    >
      <div className="mb-4">
        <Link
          href={`/activities/${activity.id}`}
          className="text-sm text-[#12960b] hover:underline"
        >
          Visualizar como aparece para a turma
        </Link>
      </div>
      <ActivityForm
        activity={activity}
        classes={classes.map((doc) => serializeClass(doc.toObject()))}
      />
    </FormShell>
  );
}
