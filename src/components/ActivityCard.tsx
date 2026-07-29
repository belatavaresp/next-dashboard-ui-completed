import Image from "next/image";
import Link from "next/link";

type ActivityCardProps = {
  title: string;
  image: string;
  id: string;
};

export default function ActivityCard({ title, image, id }: ActivityCardProps) {
  // The Drive proxy is session-guarded, and the image optimizer fetches without
  // the user's cookie, so those covers skip it and load straight from the browser.
  const isLocalImage = image.startsWith("/") && !image.startsWith("/api/");

  return (
    <Link href={`/activities/${id}`}>
      <div className="relative group w-72 h-48 rounded-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105">
        {isLocalImage ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="288px"
            className="object-cover opacity-80 group-hover:opacity-100 transition duration-300"
          />
        ) : image ? (
          // Covers can be arbitrary admin-provided URLs, so they bypass the
          // image optimizer instead of requiring a remotePatterns entry each time.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-100 transition duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-200 p-4 text-center text-sm font-medium text-zinc-600">
            {title}
          </div>
        )}
      </div>
    </Link>
  );
}
