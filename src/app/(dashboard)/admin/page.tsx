import { redirect } from "next/navigation";
import AdminTabs from "@/components/admin/AdminTabs";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { ClassModel } from "@/models/Class";
import { serializeClass, serializeUser } from "@/lib/serialize";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "admin") redirect("/");

  await connectToDatabase();

  const [users, classes] = await Promise.all([
    UserModel.find().sort({ name: 1 }).populate({ path: "classes", model: ClassModel }),
    ClassModel.find().sort({ institution: 1, grade: 1 }),
  ]);

  const serializedUsers = users.map((user) => serializeUser(user.toObject()));
  const memberCounts = serializedUsers.reduce<Record<string, number>>((acc, user) => {
    for (const entry of user.classes) {
      acc[entry.id] = (acc[entry.id] ?? 0) + 1;
    }
    return acc;
  }, {});

  return (
    // min-h-full plus a column flex lets the card below stretch to the viewport
    // bottom on short lists, while still growing when the content is taller.
    <div className="flex min-h-full flex-col p-4">
      <AdminTabs
        users={serializedUsers}
        classes={classes.map((doc) => serializeClass(doc.toObject()))}
        classMemberCounts={memberCounts}
      />
    </div>
  );
}
