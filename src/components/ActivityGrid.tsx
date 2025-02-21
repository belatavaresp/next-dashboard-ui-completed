import { activitiesData } from "@/lib/activitiesData"; // Assuming you already have this import
import ActivityCard from "./ActivityCard";

export default function ActivityGrid({ classNumber }: { classNumber: number }) {
  const filteredActivities = activitiesData.filter(
    (activity) => activity.class === classNumber
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-16 sm:p-10">
      {filteredActivities.map((activity, index) => (
        <ActivityCard
          key={index}
          title={activity.name}
          image={activity.image} // Assuming imagePath is the path to the image
          id={activity.id.toString()} // Convert the activity id to a string
        />
      ))}
    </div>
  );
}
