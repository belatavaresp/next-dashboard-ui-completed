import { useState } from "react";
import tleLogin from "@/services/apiServices";

interface UserFormProps {
  onClose: () => void;
}

export default function SignupForm({ onClose }: UserFormProps) {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [institution, setInstitution] = useState("");
  const [role, setRole] = useState<number | null>(null);
  const [userClass, setUserClass] = useState<string[]>([]);
  const [currentClass, setCurrentClass] = useState("");

  // Mapeia os papéis para números (como esperado pelo backend)
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

    if (role === null) {
      alert("Por favor, selecione um papel (Aluno, Professor ou Admin).");
      return;
    }

    try {
      const response = await tleLogin.post(
        "/user/criarUser",
        {
          name,
          nickname,
          institution,
          role, // Agora corretamente enviado como número
          Class: userClass, // Array correto
          password,
          confirmPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      alert(response.data.msg || "Usuário cadastrado com sucesso!");
      onClose();
    } catch (error: any) {
      if (error.response) {
        alert(error.response.data.msg || "Erro ao cadastrar usuário.");
      } else {
        console.error("Erro inesperado:", error);
        alert("Erro inesperado ao cadastrar usuário.");
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Cadastrar Usuário</h2>
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
                    role === roleMap[r] ? "bg-zinc-300 text-zinc-500" : "bg-zinc-100 text-zinc-400"
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
                <li key={index} className="border p-1 rounded-md mt-1 flex justify-between items-center">
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

          {/* Campos de Senha */}
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded-md"
          />
          <input
            type="password"
            placeholder="Confirmar Senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border p-2 rounded-md"
          />

          {/* Botão de Cadastro */}
          <button type="submit" className="bg-tlpLightGreen text-black p-2 rounded-md">
            Cadastrar
          </button>
        </form>
      </div>
    </div>
  );
}
