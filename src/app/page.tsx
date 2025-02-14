import Image from "next/image";
import Link from "next/link";

const Homepage = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F7F7F7] px-4 md:px-8 flex-wrap md:flex-nowrap">
      <div className="w-full md:w-1/2 max-w-lg">
        <div className="mb-6 flex justify-start">
          <Image src="/logo_tlp.png" alt="Logo The Life Education Lab" width={180} height={60} quality={100}/>
        </div>
        
        <h1 className="text-2xl font-bold text-black">
          Bem vindo à plataforma <br />
          <span className="text-green-600">The Life Education Lab!</span>
        </h1>
        <p className="mt-8 text-zinc-700">
          A plataforma digital da The Life Education, onde aprender robótica é divertido e interativo!
        </p>
        <p className="mt-6 text-zinc-700">Faça login para acessar seus materiais didáticos.</p>
        
        <div className="mt-7 flex flex-col md:flex-row md:space-x-4 space-y-3 md:space-y-0">
          <Link href="/student-sign-in">
            <button className="rounded-lg bg-white px-6 py-3 shadow-md hover:bg-zinc-100 text-zinc-500">
              Acesso aluno
            </button>
          </Link>
          
          <Link href="/teacher-sign-in">
            <button className="rounded-lg bg-white px-6 py-3 shadow-md hover:bg-zinc-100 text-zinc-500">
              Acesso professor
            </button>
          </Link>
        </div>
        
        <div className="mt-7">
          <Link href="/adm-sign-in" className="text-sm text-green-600 hover:underline">
            Clique aqui se você é um administrador
          </Link>
        </div>
      </div>
      
      <div className="hidden md:flex w-1/2 justify-center pl-16">
        <Image src="/home_background.png" alt="Criança montando robô" width={600} height={600} className="object-contain" />
      </div>
    </div>
  )
}

export default Homepage