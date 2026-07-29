import ActivityCard from "./ActivityCard";
import type { PublicActivity } from "@/lib/types";

export default function ActivityGrid({ activities }: { activities: PublicActivity[] }) {
  if (activities.length === 0) {
    return (
      <p className="p-10 text-center text-gray-500">
        Nenhuma atividade cadastrada para esta turma ainda.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-16 sm:p-10">
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          title={activity.name}
          image={activity.cover}
          id={activity.id}
        />
      ))}
    </div>
  );
}
