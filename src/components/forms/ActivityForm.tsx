"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Field, SubmitButton, inputClass } from "@/components/forms/FormShell";
import LinkPreview from "@/components/forms/LinkPreview";
import ImageUrlInput from "@/components/forms/ImageUrlInput";
import { FeedbackMessage, useFeedback } from "@/components/Feedback";
import type { PublicActivity, PublicClass } from "@/lib/types";

type ActivityFormProps = {
  activity?: PublicActivity;
  classes: PublicClass[];
  /** Pre-checked classes when creating from a class management page. */
  initialClassIds?: string[];
  /** Where to go after creating. */
  returnHref?: string;
};

export default function ActivityForm({
  activity,
  classes,
  initialClassIds,
  returnHref,
}: ActivityFormProps) {
  const router = useRouter();
  const isEditing = Boolean(activity);

  const [name, setName] = useState(activity?.name ?? "");
  const [cover, setCover] = useState(activity?.cover ?? "");
  const [activityBook, setActivityBook] = useState(activity?.activityBook ?? "");
  const [guide, setGuide] = useState(activity?.guide ?? "");
  const [extra, setExtra] = useState(activity?.extra ?? "");
  const [teacherGuide, setTeacherGuide] = useState(activity?.teacherGuide ?? "");
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    activity?.classes.map((entry) => entry.id) ?? initialClassIds ?? []
  );
  const { feedback, showSuccess, showError, clearFeedback } = useFeedback();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleClass = (classId: string) => {
    setSelectedClasses((current) =>
      current.includes(classId)
        ? current.filter((id) => id !== classId)
        : [...current, classId]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setFieldErrors({});
    setIsSubmitting(true);

    const payload = {
      name,
      cover,
      activityBook,
      guide,
      extra,
      teacherGuide,
      classes: selectedClasses,
    };

    try {
      if (isEditing && activity) {
        await api.patch(`/activities/${activity.id}`, payload);
        router.refresh();
        showSuccess("Alterações salvas.");
        setIsSubmitting(false);
      } else {
        await api.post("/activities", payload);
        router.push(returnHref ?? "/admin");
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        showError(err.message);
        setFieldErrors(err.fieldErrors ?? {});
      } else {
        showError("Erro ao salvar a atividade. Tente novamente.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Nome da atividade" error={fieldErrors.name?.[0]}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          required
        />
      </Field>

      <Field
        label="Capa"
        hint="Clique para escolher uma imagem do projeto, ou informe uma URL externa."
        error={fieldErrors.cover?.[0]}
      >
        <ImageUrlInput value={cover} onChange={setCover} />
      </Field>
      <LinkPreview url={cover} kind="image" />

      <Field
        label="Conteúdo teórico"
        hint="Link do PDF no Google Drive."
        error={fieldErrors.activityBook?.[0]}
      >
        <input
          type="text"
          value={activityBook}
          onChange={(e) => setActivityBook(e.target.value)}
          className={inputClass}
        />
      </Field>
      <LinkPreview url={activityBook} kind="document" />

      <Field
        label="Guia de montagem (opcional)"
        hint="Link do PDF no Google Drive."
        error={fieldErrors.guide?.[0]}
      >
        <input
          type="text"
          value={guide}
          onChange={(e) => setGuide(e.target.value)}
          className={inputClass}
        />
      </Field>
      <LinkPreview url={guide} kind="document" />

      <Field
        label="Conteúdo extra"
        hint="Qualquer URL, pode ser um vídeo, uma imagem, etc. Abre em uma nova aba."
        error={fieldErrors.extra?.[0]}
      >
        <input
          type="text"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          className={inputClass}
        />
      </Field>
      <LinkPreview url={extra} kind="link" />

      <Field
        label="Apoio ao professor"
        hint="Link do PDF no Google Drive. Visível apenas para professores e administradores."
        error={fieldErrors.teacherGuide?.[0]}
      >
        <input
          type="text"
          value={teacherGuide}
          onChange={(e) => setTeacherGuide(e.target.value)}
          className={inputClass}
        />
      </Field>
      <LinkPreview url={teacherGuide} kind="document" />

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Turmas</span>
        <span className="text-xs text-gray-500">
          Uma atividade pode pertencer a mais de uma turma.
        </span>
        {classes.length === 0 ? (
          <p className="text-sm text-gray-500 mt-1">Nenhuma turma cadastrada ainda.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1 max-h-64 overflow-auto">
            {classes.map((classItem) => (
              <li key={classItem.id}>
                <label className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(classItem.id)}
                    onChange={() => toggleClass(classItem.id)}
                  />
                  <span>
                    {classItem.name}{" "}
                    <span className="text-xs text-gray-500">
                      ({classItem.institution})
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FeedbackMessage feedback={feedback} />

      <SubmitButton
        isSubmitting={isSubmitting}
        label={isEditing ? "Salvar alterações" : "Criar atividade"}
      />
    </form>
  );
}
