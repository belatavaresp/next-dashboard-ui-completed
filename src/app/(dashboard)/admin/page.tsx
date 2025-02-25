"use client";

import { useState, useEffect } from "react";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import tleLogin from "@/services/apiServices";
import Image from "next/image";
import UpdateForm from "@/components/forms/UpdateForm";
import SignupForm from "@/components/forms/SignupForm";

type User = {
  name: string;
  nickname: string;
  institution: string;
  role: number;  // role will be a number, we will convert it to a string
  password: string;
  confirmPassword: string;
  Class: string[]; // Class field is an array of strings
};


const columns = [
  { header: "Info", accessor: "info" },
  { header: "Username", accessor: "nickname", className: "hidden md:table-cell" },
  { header: "Instituição", accessor: "institution", className: "hidden md:table-cell" },
  { header: "Papel", accessor: "role", className: "hidden md:table-cell" },
  { header: "Classe", accessor: "Class", className: "hidden md:table-cell" }, // Add the Class column
  { header: "Ações", accessor: "action" },
];

const AdminPage = () => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [isAscending, setIsAscending] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(7); // You can adjust this value as needed

  // Add state for searchTerm
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSort = () => {
    const sortedUsers = [...users].sort((a, b) =>
      isAscending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
    setUsers(sortedUsers);
    setIsAscending(!isAscending);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await tleLogin.get("/user/listAllUsers");
        setUsers(response.data.users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (nickname: string) => {
    try {
      // Change POST to DELETE method
      const response = await tleLogin.delete("/user/deletarUser", { data: { nickname } });

      if (response.status === 200) {
        alert("Usuário deletado com sucesso");
        // Filter out the deleted user from the list
        setUsers(users.filter(user => user.nickname !== nickname));
      }
    } catch (error) {
      console.error("Erro ao deletar usuário:");
      alert("Ocorreu um erro ao deletar o usuário");
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowUpdateModal(true);
  };

  const roleMap: { [key: number]: string } = {
    0: "Aluno",
    1: "Professor",
    2: "Admin",
  };

  // Filter users based solely on user.name
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate the users to be displayed based on the current page
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Define renderRow function
  const renderRow = (user: User) => (
    <tr key={user.nickname} className="border-b border-gray-200 even:bg-zinc-50 text-sm hover:bg-zinc-100">
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{user.name}</h3>
          <p className="text-xs text-gray-500">{user.institution}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{user.nickname}</td>
      <td className="hidden md:table-cell">{user.institution}</td>
      <td className="hidden md:table-cell">{roleMap[user.role as keyof typeof roleMap]}</td> {/* Convert role number to string */}
      <td className="hidden md:table-cell">{user.Class.join(", ")}</td> {/* Display classes */}
      <td>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-300" onClick={() => handleEdit(user)}>
            <Image src="/update.png" alt="Edit user" width={20} height={20} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-300" onClick={() => handleDelete(user.nickname)}>
            <Image src="/delete.png" alt="Delete user" width={20} height={20} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 p-4 bg-[#F7F7F7] overflow-scroll">
        <div className="bg-white p-4 rounded-md m-4 mt-0">
          <div className="flex items-center justify-between">
            <h1 className="hidden md:block text-lg font-semibold">Usuários</h1>
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              {/* Pass searchTerm and setSearchTerm to TableSearch */}
              <TableSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
              <div className="flex items-center gap-4 self-end">
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-tlpLightGreen" onClick={handleSort}>
                  <Image src="/sort.png" alt="Sort users" width={14} height={14} />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-tlpLightGreen" onClick={() => setShowFormModal(true)}>
                  <Image src="/create.png" alt="Adicionar usuário" width={14} height={14} />
                </button>
              </div>
            </div>
          </div>
          <Table columns={columns} renderRow={renderRow} data={currentUsers} />
          <Pagination totalUsers={filteredUsers.length} usersPerPage={usersPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
        </div>
        {showFormModal && <SignupForm onClose={() => setShowFormModal(false)} />}
        {showUpdateModal && selectedUser && <UpdateForm user={selectedUser} onClose={() => setShowUpdateModal(false)} />}
      </div>
    </div>
  );
};

export default AdminPage;
