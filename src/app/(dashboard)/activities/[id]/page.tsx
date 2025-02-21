"use client";

import { useParams } from "next/navigation";
import { activitiesData } from "@/lib/activitiesData";
import PDFViewer from "@/components/PDFViewer";
import Link from "next/link";

const ActivityPage = () => {
  const { id } = useParams(); // Get the activity id from the URL
  
  // Find the corresponding activity from the data
  const activity = activitiesData.find((item) => item.id.toString() === id);

  if (!activity) return <div>Activity not found</div>;

  // Extract the class number from the activity (assumed it's available)
  const classNumber = activity.class;

  return (
    <div className="container mx-auto p-6 relative">
      {/* Button to navigate back to class activity grid */}
      <Link href={`/student-${classNumber}`} passHref>
        <button className="absolute top-4 left-4 p-2 rounded-lg bg-white shadow-md hover:bg-zinc-100 text-zinc-500">
          Voltar
        </button>
      </Link>

      <h1 className="text-xl font-semibold mb-4 text-center">{activity.name}</h1>
      
      <PDFViewer
        contentLink={activity.pdfLinks.content}
        guideLink={activity.pdfLinks.guide}
        extraLink={activity.pdfLinks.extra}
      />
    </div>
  );
};

export default ActivityPage;
