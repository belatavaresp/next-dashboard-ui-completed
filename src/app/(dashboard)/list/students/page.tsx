"use client";

import { useState } from "react";
import SignupForm from "@/components/forms/SignupForm"; // Importa o formulário de cadastro
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { studentsData } from "@/lib/data";
import Image from "next/image";

type Student = {
  id: number;
  studentId: string;
  name: string;
  email?: string;
  photo: string;
  phone?: string;
  grade: number;
  class: string;
  address: string;
};

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "ID Aluno",
    accessor: "studentId",
    className: "hidden md:table-cell",
  },
  {
    header: "Turma",
    accessor: "grade",
    className: "hidden md:table-cell",
  },
  {
    header: "Ações",
    accessor: "action",
  },
];

const StudentListPage = () => {
  const [showFormModal, setShowFormModal] = useState(false); // Estado para controlar o modal

  const renderRow = (item: Student) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-zinc-50 text-sm hover:bg-zinc-100"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.photo}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.class}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.studentId}</td>
      <td className="hidden md:table-cell">{item.grade}</td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          {/* {role === "admin" && (
            <FormModal table="student" type="delete" id={item.id}/>
          )} */}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Alunos</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-tlpLightGreen">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-tlpLightGreen">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full bg-tlpLightGreen"
              onClick={() => setShowFormModal(true)}
            >
              <Image src="/create.png" alt="Adicionar usuário" width={14} height={14} />
            </button>
          </div>
        </div>
      </div>

      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={studentsData} />
      {/* PAGINATION */}
      <Pagination />

      {showFormModal && <SignupForm onClose={() => setShowFormModal(false)} />}
    </div>
  );
};

export default StudentListPage;
