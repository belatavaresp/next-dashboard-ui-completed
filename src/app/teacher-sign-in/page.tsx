import LoginForm from "@/components/forms/LoginForm";
import Image from "next/image";

const LoginPage = () => {
  return (
    <div className="flex h-screen">
      <div className="relative hidden lg:flex w-1/2 items-center justify-center pl-8">
        <div className="">
          <Image
            src="/teacher-login.png"
            alt="Professor e crianças montando robôs"
            fill={true}
            className=""
            objectFit="cover"
            quality={100}
          />
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center bg-white p-8">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
