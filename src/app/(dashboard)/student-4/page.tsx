import ActivityGrid from "@/components/ActivityGrid";

const StudentPage = () => {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 mt-16">
      {/* TITLE */}
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        4º Ano: Montagens iniciais
      </h1>

      {/* ACTIVITY GRID */}
      <div className="w-full flex items-center justify-center">
        <ActivityGrid classNumber={5} />
      </div>
    </div>
  );
};

export default StudentPage;
