"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import tleLogin from "@/services/apiServices";
import Link from "next/link";
import Image from "next/image";
import Cookies from "js-cookie"; // Add this for handling cookies

interface LoginFormProps {
  redirectPath: string; // Path to redirect upon successful login
  requiredRole: number; // Role required to access this login page (0 = student, 1 = teacher, 2 = admin)
}

const LoginForm: React.FC<LoginFormProps> = ({ redirectPath, requiredRole }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await tleLogin.post("/user/loginUser", { nickname, password });
  
      if (response.data.success) {
        const user = response.data.user;
        
        // Check if user has the correct role
        if (user.role !== requiredRole) {
          setError("Acesso negado. Você não tem permissão para acessar esta página.");
          return;
        }
  
        // Store authentication token in HTTP-only cookie (handled server-side)
        Cookies.set("authToken", response.data.token, { expires: 1, secure: true });
        console.log(`Cookies set`);
  
        // Use a small delay before redirecting to allow the browser to save the cookie
        setTimeout(() => {
          // Redirect user based on role
          if (user.role === 0) {
            router.push(`/student-${user.Class[0]}`);
          } else {
            router.push(redirectPath);
          }
        }, 900);  // Delay to ensure the cookie is available
      } else {
        setError(response.data.message || "Credenciais inválidas. Tente novamente.");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor. Tente novamente mais tarde.");
    }
  };  

  return (
    <div className="w-full max-w-sm">
      <div className="mb-4 flex flex-col items-start">
        <Image src="/logo_tlp.png" alt="Logo TLE-Lab" width={150} height={150} />
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Bem-vindo(a) ao TLE-Lab!</h2>
        <p className="text-gray-500">Uma plataforma por The Life Education</p>
      </div>

      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Usuário</label>
          <input
            type="text"
            placeholder="Nome de usuário"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 focus:border-[#12960b] focus:outline-none"
            required
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Senha</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 pr-10 focus:border-[#12960b] focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Image
                src={showPassword ? "/closedEye.png" : "/openEye.png"}
                alt="Toggle password visibility"
                width={20}
                height={20}
              />
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-[#1adf0e] px-4 py-2 text-white hover:bg-[#12960b]"
        >
          Login
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Não foi cadastrado?{" "}
        <Link href="#" className="text-[#12960b] hover:underline">
          Entrar em contato
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
