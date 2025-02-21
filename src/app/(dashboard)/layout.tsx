import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex flex-col">
      {/* NAVBAR */}
      <div className="flex items-center justify-between py-2 px-4">
        {/* Logo on the upper left */}
        <Link href="/" className="flex items-center">
          <Image src="/logo_tlp.png" alt="logo" width={130} height={10} />
        </Link>
        {/* Navbar */}
        <Navbar />
      </div>

      {/* PAGE CONTENT */}
      <div className="flex-1 overflow-scroll bg-[#F7F7F7]">
        {children}
      </div>
    </div>
  );
}
