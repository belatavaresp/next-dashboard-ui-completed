"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { PublicActivity } from "@/lib/types";
import { FeedbackMessage, useFeedback } from "@/components/Feedback";

type ClassActivitiesProps = {
  classId: string;
  activities: PublicActivity[];
};

export default function ClassActivities({ classId, activities }: ClassActivitiesProps) {
  const router = useRouter();
  const { feedback, showSuccess, showError, clearFeedback } = useFeedback();
  const [isWorking, setIsWorking] = useState(false);

  /** Removing from a class only detaches it; the activity itself is kept. */
  const detach = async (activity: PublicActivity) => {
    if (!confirm(`Remover "${activity.name}" desta turma?`)) return;
    clearFeedback();
    setIsWorking(true);
    try {
      await api.patch(`/activities/${activity.id}`, {
        name: activity.name,
        cover: activity.cover ?? "",
        guide: activity.guide ?? "",
        activityBook: activity.activityBook ?? "",
        extra: activity.extra ?? "",
        teacherGuide: activity.teacherGuide ?? "",
        classes: activity.classes
          .map((entry) => entry.id)
          .filter((id) => id !== classId),
      });
      router.refresh();
      showSuccess(`"${activity.name}" foi removida desta turma.`);
    } catch (err) {
      showError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível remover a atividade da turma."
      );
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <section className="bg-white p-6 rounded-md">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">Atividades e guias</h2>
        <Link
          href={`/admin/activities/new?classId=${classId}`}
          className="rounded-md bg-tlpLightGreen px-4 py-2 text-sm text-black"
        >
          Nova atividade
        </Link>
      </div>

      <FeedbackMessage feedback={feedback} className="mb-4" />

      {activities.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nenhuma atividade associada a esta turma ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="flex items-center justify-between gap-4 rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <div>
                <Link
                  href={`/admin/activities/${activity.id}`}
                  className="font-medium hover:underline"
                >
                  {activity.name}
                </Link>
                <p className="text-xs text-gray-500">
                  {[
                    activity.activityBook && "conteúdo",
                    activity.guide && "guia",
                    activity.extra && "extra",
                    activity.teacherGuide && "apoio ao professor",
                  ]
                    .filter(Boolean)
                    .join(", ") || "sem materiais"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href={`/admin/activities/${activity.id}`}
                  className="text-sm text-[#12960b] hover:underline"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  disabled={isWorking}
                  onClick={() => detach(activity)}
                  className="text-sm text-red-600 hover:underline disabled:opacity-60"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
