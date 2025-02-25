"use client";

import LoginForm from "@/components/forms/LoginForm";
import Image from "next/image";

const LoginPage = () => {
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
        <LoginForm redirectPath="/student-sign-in" requiredRole={0} />
      </div>
    </div>
  );
};

export default LoginPage;
