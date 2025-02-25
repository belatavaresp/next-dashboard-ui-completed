"use client";

import { useEffect, useState } from "react";

interface DecodedUser {
  role: number;
  name: string;
}

const Navbar = () => {
  const [user, setUser] = useState<DecodedUser | null>(null); // State can be null initially
  const [loading, setLoading] = useState(true); // To manage loading state

  useEffect(() => {
    console.log("useEffect triggered");

    // Query the document to get the values from meta tags
    const roleMeta = document.head.querySelector("meta[name='X-User-Role']") as HTMLMetaElement;
    const nameMeta = document.head.querySelector("meta[name='X-User-Name']") as HTMLMetaElement;

    // Log to debug what is happening
    console.log("roleMeta content:", roleMeta?.content);
    console.log("nameMeta content:", nameMeta?.content);

    if (roleMeta?.content && nameMeta?.content) {
      setUser({
        role: Number(roleMeta.content),
        name: nameMeta.content,
      });
    }

    setLoading(false); // Set loading to false after fetching data
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show loading message while fetching the user data
  }

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-6 justify-end w-full">
        <div className="flex flex-col">
          <span className="text-xs leading-3 font-medium">
            {user?.name || "John Doe"}
          </span>
          <span className="text-[10px] text-gray-500 text-right">
            {user?.role === 2 ? "Administrador(a)" : user?.role === 1 ? "Professor(a)" : "Aluno(a)"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
