import { useState, useEffect } from "react";
import tleLogin from "@/services/apiServices";

interface UpdateFormProps {
  user: {
    name: string;
    nickname: string;
    institution: string;
    role: number;
    Class: string[]; // userClass should always be an array
  };
  onClose: () => void;
}

export default function UpdateForm({ user, onClose }: UpdateFormProps) {
  const [name, setName] = useState(user.name);
  const [nickname, setNickname] = useState(user.nickname);
  const [institution, setInstitution] = useState(user.institution);
  const [role, setRole] = useState<number>(user.role);
  const [userClass, setUserClass] = useState<string[]>(user.Class || []); // Ensure userClass is an array
  const [currentClass, setCurrentClass] = useState("");

  const roleMap: { [key: string]: number } = {
    Aluno: 0,
    Professor: 1,
    Admin: 2,
  };

  const addClass = () => {
    if (currentClass.trim() !== "" && !userClass.includes(currentClass.trim())) {
      setUserClass([...userClass, currentClass.trim()]);
      setCurrentClass("");
    }
  };

  const removeClass = (index: number) => {
    setUserClass(userClass.filter((_, i) => i !== index));
  };

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
          userClass, // User classes
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

          {/* Seletor de Role */}
          <div className="flex flex-col">
            <span className="text-sm font-medium">Selecione o papel:</span>
            <div className="flex gap-2 mt-2">
              {Object.keys(roleMap).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`px-4 py-2 rounded-md border ${
                    role === roleMap[r]
                      ? "bg-zinc-300 text-zinc-500"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                  onClick={() => setRole(roleMap[r])}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Campo para adicionar Classes */}
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar classe"
                value={currentClass}
                onChange={(e) => setCurrentClass(e.target.value)}
                className="border p-2 rounded-md flex-1"
              />
              <button
                type="button"
                onClick={addClass}
                className="bg-zinc-200 text-zinc-500 p-2 rounded-md"
              >
                Adicionar
              </button>
            </div>

            {/* Lista de Classes adicionadas */}
            <ul className="mt-2">
              {userClass.map((cls, index) => (
                <li
                  key={index}
                  className="border p-1 rounded-md mt-1 flex justify-between items-center"
                >
                  {cls}
                  <button
                    type="button"
                    onClick={() => removeClass(index)}
                    className="text-red-500 text-sm"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          </div>

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