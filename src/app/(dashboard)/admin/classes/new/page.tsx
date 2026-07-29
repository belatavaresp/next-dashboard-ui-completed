import { redirect } from "next/navigation";
import ClassForm from "@/components/forms/ClassForm";
import { FormShell } from "@/components/forms/FormShell";
import { getSession } from "@/lib/auth";

export default async function NewClassPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  return (
    <FormShell
      title="Nova turma"
      description="Depois de criar a turma você poderá associar usuários e atividades."
      backHref="/admin"
    >
      <ClassForm />
    </FormShell>
  );
}
