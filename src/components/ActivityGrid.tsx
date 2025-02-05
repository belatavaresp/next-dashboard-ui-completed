import ActivityCard from "./ActivityCard";

const activities = [
  { title: "Atividade 1", image: "/atv_1.png", link: "https://drive.google.com/file/d/19wvKyeI3jMJk2zLVTsrMppw6SEPs8wtC/preview" },
  { title: "Atividade 2", image: "/atv_2.png", link: "https://drive.google.com/file/d/19wvKyeI3jMJk2zLVTsrMppw6SEPs8wtC/preview" },
  { title: "Atividade 3", image: "/atv_3.png", link: "https://drive.google.com/file/d/19wvKyeI3jMJk2zLVTsrMppw6SEPs8wtC/preview" },
  { title: "Atividade 4", image: "/atv_4.png", link: "https://drive.google.com/file/d/19wvKyeI3jMJk2zLVTsrMppw6SEPs8wtC/preview" },
  { title: "Atividade 5", image: "/atv_5.png", link: "https://drive.google.com/file/d/19wvKyeI3jMJk2zLVTsrMppw6SEPs8wtC/preview" },
  { title: "Atividade 6", image: "/atv_6.png", link: "https://drive.google.com/file/d/19wvKyeI3jMJk2zLVTsrMppw6SEPs8wtC/preview" },
];

export default function ActivityGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-16 sm:p-10">
      {activities.map((activity, index) => (
        <ActivityCard key={index} {...activity} />
      ))}
    </div>
  );
}
