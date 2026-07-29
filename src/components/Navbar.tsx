"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { ROLE_LABELS, type Role } from "@/lib/types";

type NavbarProps = {
  name?: string;
  role?: Role;
};

const Navbar = ({ name, role }: NavbarProps) => {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await api.post("/auth/logout");
      router.replace("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-6 justify-end w-full">
        {name && (
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium text-gray-700">{name}</span>
            {role && (
              <span className="text-xs text-gray-500">{ROLE_LABELS[role]}</span>
            )}
          </div>
        )}
        {role && (
          <button
            type="button"
            onClick={handleLogout}
            disabled={isSigningOut}
            title="Sair"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 hover:bg-zinc-300 disabled:opacity-60"
          >
            <Image src="/logout.png" alt="Sair" width={16} height={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
