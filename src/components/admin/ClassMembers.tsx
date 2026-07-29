"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ROLE_LABELS, displayName, type PublicUser } from "@/lib/types";
import { FeedbackMessage, useFeedback } from "@/components/Feedback";

type ClassMembersProps = {
  classId: string;
  members: PublicUser[];
  /** Students and teachers not currently in this class. */
  candidates: PublicUser[];
};

export default function ClassMembers({
  classId,
  members,
  candidates,
}: ClassMembersProps) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const { feedback, showSuccess, showError, clearFeedback } = useFeedback();
  const [isWorking, setIsWorking] = useState(false);

  const run = async (work: () => Promise<unknown>, successMessage: string) => {
    clearFeedback();
    setIsWorking(true);
    try {
      await work();
      router.refresh();
      showSuccess(successMessage);
    } catch (err) {
      showError(
        err instanceof ApiError ? err.message : "Não foi possível atualizar a turma."
      );
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <section className="bg-white p-6 rounded-md">
      <h2 className="text-lg font-semibold mb-1">Usuários da turma</h2>
      <p className="text-sm text-gray-500 mb-4">
        O tipo de usuário não pode ser alterado aqui.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="border p-2 rounded-md flex-1"
        >
          <option value="">Selecione um usuário...</option>
          {candidates.map((user) => (
            <option key={user.id} value={user.id}>
              {displayName(user)} ({ROLE_LABELS[user.role]})
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selected || isWorking}
          onClick={() =>
            run(async () => {
              await api.post(`/classes/${classId}/users`, { userId: selected });
              setSelected("");
            }, "Usuário adicionado à turma.")
          }
          className="rounded-md bg-tlpLightGreen px-4 py-2 text-black disabled:opacity-60"
        >
          Adicionar
        </button>
      </div>

      <FeedbackMessage feedback={feedback} className="mb-4" />

      {members.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum usuário nesta turma ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-4 rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <div>
                <Link
                  href={`/admin/users/${member.id}`}
                  className="font-medium hover:underline"
                >
                  {displayName(member)}
                </Link>
                <p className="text-xs text-gray-500">
                  {ROLE_LABELS[member.role]} &middot; {member.username}
                </p>
              </div>
              <button
                type="button"
                disabled={isWorking}
                onClick={() =>
                  run(
                    () =>
                      api.delete(`/classes/${classId}/users`, { userId: member.id }),
                    `${displayName(member)} foi removido da turma.`
                  )
                }
                className="text-sm text-red-600 hover:underline disabled:opacity-60"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
