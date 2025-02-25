import Image from "next/image";
import Link from "next/link";

type ActivityCardProps = {
  title: string;
  image: string;
  id: string; // Add the activity ID to navigate to the correct page
};

export default function ActivityCard({ title, image, id }: ActivityCardProps) {
  // Construct the link to the PDF viewer page for this activity
  const link = `/activities/${id}`;

  return (
    <Link href={link}>
      <div className="relative group w-72 h-48 rounded-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105">
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
