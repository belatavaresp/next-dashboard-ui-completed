"use client";

import LoginForm from "@/components/forms/LoginForm";
import tleLogin from "@/services/apiServices";
import Image from "next/image";
import { useState } from "react";

const LoginPage = () => {
  const createUser = async () => {
    try {
      const userData = {
        name: "izabela",
        email: "belabh2003@gmail.com",
        password: "123456",
        confirmPassword: "123456",
      };

      const response = await tleLogin.post("/user/criarUser", userData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Usuário criado com sucesso:", response.data);
      alert("Usuário criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      alert("Erro ao criar usuário");
    }
  };

  return (
    <div className="flex h-screen">
      {/* Imagem de fundo */}
      <div className="relative hidden lg:flex w-1/2 items-center justify-center pl-8">
        <Image
          src="/login_background.png"
          alt="Crianças montando robôs"
          fill={true}
          className="object-cover"
          quality={100}
        />
      </div>

      {/* Formulário e botão */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-white p-8">
        <LoginForm />
        <button
          onClick={createUser}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Criar Usuário
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
