import { useState } from "react";
import tleLogin from "@/services/apiServices";

interface UpdateFormProps {
  user: {
    name: string;
    nickname: string;
    institution: string;
    role: string;
  };
  onClose: () => void;
}

export default function UpdateForm({ user, onClose }: UpdateFormProps) {
  const [name, setName] = useState(user.name);
  const [nickname, setNickname] = useState(user.nickname);
  const [institution, setInstitution] = useState(user.institution);
  const [role, setRole] = useState("");

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tleLogin.post(
        `/user/editarUser/${user.nickname}`,
        {
          name,
          nickname,
          institution,
          role,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      alert("Usuário atualizado com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      alert("Erro ao atualizar usuário.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Atualizar Usuário</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded-md"
          />
          <input
            type="text"
            placeholder="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="border p-2 rounded-md"
          />
          <input
            type="text"
            placeholder="Instituição"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            className="border p-2 rounded-md"
          />
          <input
            type="text"
            placeholder="Papel"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border p-2 rounded-md"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tlpLightGreen text-white rounded-md"
            >
              Atualizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}