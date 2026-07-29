"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Field, SubmitButton, inputClass } from "@/components/forms/FormShell";
import { FeedbackMessage, useFeedback } from "@/components/Feedback";
import StatusToggle from "@/components/StatusToggle";
import { type PublicClass, type Status } from "@/lib/types";

export default function ClassForm({ classItem }: { classItem?: PublicClass }) {
  const router = useRouter();
  const isEditing = Boolean(classItem);

  const [name, setName] = useState(classItem?.name ?? "");
  const [grade, setGrade] = useState(classItem?.grade ?? "");
  const [institution, setInstitution] = useState(classItem?.institution ?? "");
  const [status, setStatus] = useState<Status>(classItem?.status ?? "active");
  const { feedback, showSuccess, showError, clearFeedback } = useFeedback();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setFieldErrors({});
    setIsSubmitting(true);

    const payload = { name, grade, institution, status };

    try {
      if (isEditing && classItem) {
        await api.patch(`/classes/${classItem.id}`, payload);
        router.refresh();
        showSuccess("Alterações salvas.");
        setIsSubmitting(false);
      } else {
        const created = await api.post<{ class: PublicClass }>("/classes", payload);
        router.push(`/admin/classes/${created.class.id}`);
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        showError(err.message);
        setFieldErrors(err.fieldErrors ?? {});
      } else {
        showError("Erro ao salvar a turma. Tente novamente.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Nome da turma" error={fieldErrors.name?.[0]}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          required
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Ano/série"
          hint="Usado pelos links antigos, como /student-6."
          error={fieldErrors.grade?.[0]}
        >
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Instituição" error={fieldErrors.institution?.[0]}>
          <input
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
      </div>

      <Field
        label="Status"
        hint="Turmas inativas não aparecem para professores e alunos."
        error={fieldErrors.status?.[0]}
      >
        <div className="py-1">
          <StatusToggle status={status} onChange={setStatus} showLabel />
        </div>
      </Field>

      <FeedbackMessage feedback={feedback} />

      <SubmitButton
        isSubmitting={isSubmitting}
        label={isEditing ? "Salvar alterações" : "Criar turma"}
      />
    </form>
  );
}
