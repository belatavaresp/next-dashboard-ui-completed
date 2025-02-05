import { role } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/lesson.png",
        label: "Life Projects",
        href: "/student",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/teacher.png",
        label: "Professor",
        href: "/teacher",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/setting.png",
        label: "Gerenciador de alunos",
        href: "/list/students",
        visible: ["admin"],
      },
      {
        icon: "/setting.png",
        label: "Gerenciador de professores",
        href: "/list/teachers",
        visible: ["admin"],
      }
    ],
  },
  {
    title: "OUTROS",
    items: [
      {
        icon: "/logout.png",
        label: "Sair",
        href: "/logout",
        visible: ["admin", "teacher", "student"],
      },
    ],
  },
];

const Menu = () => {
  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            if (item.visible.includes(role)) {
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-zinc-100"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            }
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
