import Image from "next/image";
import Link from "next/link";

export default function ActivityCard({ title, image, link }:
    {
        title: string,
        image: string,
        link: string
    }
) {
  return (
    <Link href={link}>
      <div className="relative group w-72 h-48 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition duration-300 hover:scale-105">
      <Image
          src={image}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="opacity-80 group-hover:opacity-100 transition duration-300"
        />
      </div>
    </Link>
  );
}