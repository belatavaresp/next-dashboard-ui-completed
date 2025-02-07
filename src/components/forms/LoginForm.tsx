import Link from "next/link";
import Image from "next/image";

const LoginForm = () => {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-4 flex flex-col items-start">
        <Image
          src="/logo_tlp.png"
          alt="Logo TLE-Lab"
          width={150}
          height={150}
        />
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Bem-vindo(a) ao TLE-Lab!</h2>
        <p className="text-gray-500">Uma plataforma por The Life Education</p>
      </div>

      <form>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            placeholder="mail@abc.com"
            className="w-full rounded-lg border px-4 py-2 focus:border-[#12960b] focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Senha</label>
          <input
            type="password"
            placeholder="********"
            className="w-full rounded-lg border px-4 py-2 focus:border-[#12960b] focus:outline-none"
          />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <label className="flex items-center text-sm text-gray-700">
            <input type="checkbox" className="mr-2" /> Lembrar de mim
          </label>
          <Link href="#" className="text-sm text-[#12960b] hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <button className="w-full rounded-lg bg-[#1adf0e] px-4 py-2 text-white hover:bg-[#12960b]">
          Login
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Não foi cadastrado? <Link href="#" className="text-[#12960b] hover:underline">Entrar em contato</Link>
      </div>
    </div>
  );
};

export default LoginForm;
