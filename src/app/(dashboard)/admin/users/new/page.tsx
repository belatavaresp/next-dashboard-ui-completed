import { redirect } from "next/navigation";
import UserForm from "@/components/forms/UserForm";
import { FormShell } from "@/components/forms/FormShell";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ClassModel } from "@/models/Class";
import { serializeClass } from "@/lib/serialize";

export default async function NewUserPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  await connectToDatabase();
  const classes = await ClassModel.find().sort({ institution: 1, grade: 1 });

  return (
    <FormShell title="Novo usuário" backHref="/admin">
      <UserForm classes={classes.map((doc) => serializeClass(doc.toObject()))} />
    </FormShell>
  );
}
