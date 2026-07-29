import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listClassesForSession } from "@/lib/queries";

export default async function TeacherPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const classes = await listClassesForSession(session);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 mt-16">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Minhas turmas
      </h1>

      {classes.length === 0 ? (
        <p className="text-gray-500">
          Você ainda não está associado a nenhuma turma ativa.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-10 w-full max-w-5xl">
          {classes.map((classItem) => (
            <Link key={classItem.id} href={`/class/${classItem.id}`}>
              <div className="flex h-32 flex-col justify-center rounded-lg bg-white p-6 shadow-md transition duration-300 hover:scale-105">
                <h2 className="text-lg font-semibold text-gray-800">{classItem.name}</h2>
                <p className="text-sm text-gray-500">{classItem.institution}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
