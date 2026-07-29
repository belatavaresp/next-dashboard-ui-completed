import { notFound, redirect } from "next/navigation";
import UserForm from "@/components/forms/UserForm";
import { FormShell } from "@/components/forms/FormShell";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { ClassModel } from "@/models/Class";
import { serializeClass, serializeUser } from "@/lib/serialize";
import { isValidObjectId } from "mongoose";

type PageProps = { params: Promise<{ id: string }> };

export default async function UserManagementPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectToDatabase();
  const [user, classes] = await Promise.all([
    UserModel.findById(id).populate({ path: "classes", model: ClassModel }),
    ClassModel.find().sort({ institution: 1, grade: 1 }),
  ]);
  if (!user) notFound();

  const serialized = serializeUser(user.toObject());

  return (
    <FormShell
      title={`${serialized.name} ${serialized.lastName}`.trim()}
      description={`Usuário: ${serialized.username}`}
      backHref="/admin"
    >
      <UserForm
        user={serialized}
        classes={classes.map((doc) => serializeClass(doc.toObject()))}
      />
    </FormShell>
  );
}
