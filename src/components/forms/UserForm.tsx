"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Field, SubmitButton, inputClass } from "@/components/forms/FormShell";
import { FeedbackMessage, useFeedback } from "@/components/Feedback";
import StatusToggle from "@/components/StatusToggle";
import {
  ROLES,
  ROLE_LABELS,
  type PublicClass,
  type PublicUser,
  type Role,
  type Status,
} from "@/lib/types";

type UserFormProps = {
  user?: PublicUser;
  classes: PublicClass[];
};

export default function UserForm({ user, classes }: UserFormProps) {
  const router = useRouter();
  const isEditing = Boolean(user);

  const [name, setName] = useState(user?.name ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "student");
  const [status, setStatus] = useState<Status>(user?.status ?? "active");
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    user?.classes.map((entry) => entry.id) ?? []
  );
  const { feedback, showSuccess, showError, clearFeedback } = useFeedback();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    // Cardinality differs per role, so trim the selection when it no longer fits.
    if (nextRole === "admin") setSelectedClasses([]);
    if (nextRole === "student") setSelectedClasses((current) => current.slice(0, 1));
  };

  const toggleClass = (classId: string) => {
    if (role === "student") {
      setSelectedClasses([classId]);
      return;
    }
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
      lastName,
      username,
      role,
      status,
      classes: selectedClasses,
      ...(password ? { password } : {}),
    };

    try {
      if (isEditing && user) {
        await api.patch(`/users/${user.id}`, payload);
        router.refresh();
        // Staying put is what makes the confirmation visible; the list view would
        // have discarded it on navigation.
        showSuccess("Alterações salvas.");
        setPassword("");
        setIsSubmitting(false);
      } else {
        await api.post("/users", payload);
        router.push("/admin");
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        showError(err.message);
        setFieldErrors(err.fieldErrors ?? {});
      } else {
        showError("Erro ao salvar o usuário. Tente novamente.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nome" error={fieldErrors.name?.[0]}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Sobrenome" error={fieldErrors.lastName?.[0]}>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Usuário" error={fieldErrors.username?.[0]}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
          required
        />
      </Field>

      <Field
        label={isEditing ? "Nova senha" : "Senha"}
        hint={isEditing ? "Deixe em branco para manter a senha atual." : undefined}
        error={fieldErrors.password?.[0]}
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          required={!isEditing}
        />
      </Field>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Tipo de usuário</span>
        <div className="flex gap-2 mt-1">
          {ROLES.map((option) => (
            <button
              key={option}
              type="button"
              className={`px-4 py-2 rounded-md border ${
                role === option
                  ? "bg-zinc-300 text-zinc-600"
                  : "bg-zinc-100 text-zinc-400"
              }`}
              onClick={() => handleRoleChange(option)}
            >
              {ROLE_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <Field
        label="Status"
        hint="Usuários inativos não conseguem entrar no sistema."
        error={fieldErrors.status?.[0]}
      >
        <div className="py-1">
          <StatusToggle status={status} onChange={setStatus} showLabel />
        </div>
      </Field>

      {role !== "admin" && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            {role === "student" ? "Turma" : "Turmas"}
          </span>
          <span className="text-xs text-gray-500">
            {role === "student"
              ? "Alunos pertencem a exatamente uma turma."
              : "Professores podem ser associados a várias turmas."}
          </span>
          {classes.length === 0 ? (
            <p className="text-sm text-gray-500 mt-1">
              Nenhuma turma cadastrada ainda.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1 max-h-64 overflow-auto">
              {classes.map((classItem) => (
                <li key={classItem.id}>
                  <label className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <input
                      type={role === "student" ? "radio" : "checkbox"}
                      name="classes"
                      checked={selectedClasses.includes(classItem.id)}
                      onChange={() => toggleClass(classItem.id)}
                    />
                    <span>
                      {classItem.name}{" "}
                      <span className="text-xs text-gray-500">
                        ({classItem.institution}
                        {classItem.status === "inactive" ? ", inativa" : ""})
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {fieldErrors.classes?.[0] && (
            <span className="text-xs text-red-600">{fieldErrors.classes[0]}</span>
          )}
        </div>
      )}

      <FeedbackMessage feedback={feedback} />

      <SubmitButton
        isSubmitting={isSubmitting}
        label={isEditing ? "Salvar alterações" : "Cadastrar usuário"}
      />
    </form>
  );
}
