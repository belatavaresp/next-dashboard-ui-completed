"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { api, ApiError } from "@/lib/api";
import { FeedbackMessage, useFeedback } from "@/components/Feedback";
import StatusToggle from "@/components/StatusToggle";
import {
  ROLE_LABELS,
  displayName,
  type PublicClass,
  type PublicUser,
  type Status,
} from "@/lib/types";

const ITEMS_PER_PAGE = 7;

const userColumns = [
  { header: "Info", accessor: "info" },
  { header: "Usuário", accessor: "username", className: "hidden md:table-cell" },
  { header: "Tipo", accessor: "role", className: "hidden md:table-cell" },
  { header: "Turmas", accessor: "classes", className: "hidden md:table-cell" },
  { header: "Status", accessor: "status", className: "hidden md:table-cell" },
  { header: "Ações", accessor: "action" },
];

const classColumns = [
  { header: "Turma", accessor: "name" },
  { header: "Instituição", accessor: "institution", className: "hidden md:table-cell" },
  { header: "Usuários", accessor: "users", className: "hidden md:table-cell" },
  { header: "Status", accessor: "status", className: "hidden md:table-cell" },
  { header: "Prévia", accessor: "preview" },
  { header: "Ações", accessor: "action" },
];

type AdminTabsProps = {
  users: PublicUser[];
  classes: PublicClass[];
  /** Member counts per class id, computed on the server. */
  classMemberCounts: Record<string, number>;
};

type Tab = "users" | "classes";

export default function AdminTabs({
  users,
  classes,
  classMemberCounts,
}: AdminTabsProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAscending, setIsAscending] = useState(true);
  const { feedback, showSuccess, showError, clearFeedback } = useFeedback();

  const switchTab = (next: Tab) => {
    setTab(next);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const list = users.filter(
      (user) =>
        displayName(user).toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term)
    );
    return [...list].sort((a, b) =>
      isAscending
        ? displayName(a).localeCompare(displayName(b))
        : displayName(b).localeCompare(displayName(a))
    );
  }, [users, searchTerm, isAscending]);

  const filteredClasses = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const list = classes.filter(
      (classItem) =>
        classItem.name.toLowerCase().includes(term) ||
        classItem.institution.toLowerCase().includes(term)
    );
    return [...list].sort((a, b) =>
      isAscending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
  }, [classes, searchTerm, isAscending]);

  const total = tab === "users" ? filteredUsers.length : filteredClasses.length;
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageUsers = filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  const pageClasses = filteredClasses.slice(start, start + ITEMS_PER_PAGE);

  /** Id of the row being saved, so only that toggle is disabled while in flight. */
  const [pendingStatusId, setPendingStatusId] = useState("");

  const toggleStatus = async (
    kind: "users" | "classes",
    { id, label }: { id: string; label: string },
    next: Status
  ) => {
    clearFeedback();
    setPendingStatusId(id);
    try {
      await api.patch(`/${kind}/${id}/status`, { status: next });
      router.refresh();
      showSuccess(
        `"${label}" agora está ${next === "active" ? "ativo" : "inativo"}.`
      );
    } catch (err) {
      showError(
        err instanceof ApiError ? err.message : "Não foi possível alterar o status."
      );
    } finally {
      setPendingStatusId("");
    }
  };

  const handleDeleteUser = async (user: PublicUser) => {
    if (!confirm(`Excluir o usuário "${displayName(user)}"?`)) return;
    clearFeedback();
    try {
      await api.delete(`/users/${user.id}`);
      router.refresh();
      showSuccess(`Usuário "${displayName(user)}" excluído.`);
    } catch {
      showError("Não foi possível excluir o usuário.");
    }
  };

  const handleDeleteClass = async (classItem: PublicClass) => {
    if (!confirm(`Excluir a turma "${classItem.name}"?`)) return;
    clearFeedback();
    try {
      await api.delete(`/classes/${classItem.id}`);
      router.refresh();
      showSuccess(`Turma "${classItem.name}" excluída.`);
    } catch {
      showError("Não foi possível excluir a turma.");
    }
  };

  const renderUserRow = (user: PublicUser) => (
    <tr
      key={user.id}
      className="border-b border-gray-200 even:bg-zinc-50 text-sm hover:bg-zinc-100"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{displayName(user)}</h3>
          <p className="text-xs text-gray-500">
            {user.classes.map((entry) => entry.institution).join(", ") || "—"}
          </p>
        </div>
      </td>
      <td className="hidden md:table-cell">{user.username}</td>
      <td className="hidden md:table-cell">{ROLE_LABELS[user.role]}</td>
      <td className="hidden md:table-cell">
        {user.classes.map((entry) => entry.name).join(", ") || "—"}
      </td>
      <td className="hidden md:table-cell">
        <StatusToggle
          status={user.status}
          disabled={pendingStatusId === user.id}
          onChange={(next) =>
            toggleStatus("users", { id: user.id, label: displayName(user) }, next)
          }
        />
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/users/${user.id}`}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-300"
            title="Editar usuário"
          >
            <Image src="/update.png" alt="Editar usuário" width={20} height={20} />
          </Link>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-300"
            onClick={() => handleDeleteUser(user)}
            title="Excluir usuário"
          >
            <Image src="/delete.png" alt="Excluir usuário" width={20} height={20} />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderClassRow = (classItem: PublicClass) => (
    <tr
      key={classItem.id}
      className="border-b border-gray-200 even:bg-zinc-50 text-sm hover:bg-zinc-100"
    >
      <td className="p-4">
        <h3 className="font-semibold">{classItem.name}</h3>
        <p className="text-xs text-gray-500">{classItem.grade}º ano</p>
      </td>
      <td className="hidden md:table-cell">{classItem.institution}</td>
      <td className="hidden md:table-cell">
        {classMemberCounts[classItem.id] ?? 0}
      </td>
      <td className="hidden md:table-cell">
        <StatusToggle
          status={classItem.status}
          disabled={pendingStatusId === classItem.id}
          onChange={(next) =>
            toggleStatus("classes", { id: classItem.id, label: classItem.name }, next)
          }
        />
      </td>
      <td>
        {/* Admins see the class page in full, so this is the real student view
            plus the teacher-only sections. */}
        <Link
          href={`/class/${classItem.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-300"
          title="Visualizar a página da turma em uma nova aba"
        >
          <Image src="/openEye.png" alt="Visualizar turma" width={18} height={18} />
        </Link>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/classes/${classItem.id}`}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-300"
            title="Gerenciar turma"
          >
            <Image src="/update.png" alt="Gerenciar turma" width={20} height={20} />
          </Link>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-300"
            onClick={() => handleDeleteClass(classItem)}
            title="Excluir turma"
          >
            <Image src="/delete.png" alt="Excluir turma" width={20} height={20} />
          </button>
        </div>
      </td>
    </tr>
  );

  const createHref = tab === "users" ? "/admin/users/new" : "/admin/classes/new";

  return (
    <div className="flex flex-1 flex-col bg-white p-4 rounded-md m-4 mt-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["users", "classes"] as Tab[]).map((option) => (
            <button
              key={option}
              onClick={() => switchTab(option)}
              className={`px-4 py-2 rounded-md text-sm font-semibold ${
                tab === option
                  ? "bg-tlpLightGreen text-black"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {option === "users" ? "Usuários" : "Turmas"}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <div className="flex items-center gap-4 self-end">
            <Link
              href="/admin/activities/new"
              className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200"
            >
              Nova atividade
            </Link>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-tlpLightGreen"
              onClick={() => setIsAscending((value) => !value)}
              title="Ordenar"
            >
              <Image src="/sort.png" alt="Ordenar" width={14} height={14} />
            </button>
            <Link
              href={createHref}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-tlpLightGreen"
              title={tab === "users" ? "Adicionar usuário" : "Adicionar turma"}
            >
              <Image src="/create.png" alt="Adicionar" width={14} height={14} />
            </Link>
          </div>
        </div>
      </div>

      <FeedbackMessage feedback={feedback} className="mt-4" />

      {/* Takes the leftover height so pagination sits at the bottom of the card. */}
      <div className="flex-1 overflow-auto">
        {tab === "users" ? (
          <Table columns={userColumns} renderRow={renderUserRow} data={pageUsers} />
        ) : (
          <Table columns={classColumns} renderRow={renderClassRow} data={pageClasses} />
        )}
      </div>

      <Pagination
        totalItems={total}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}
