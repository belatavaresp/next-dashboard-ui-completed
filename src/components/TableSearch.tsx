import { Dispatch, SetStateAction } from "react";
import Image from "next/image";

// Define the types for the props
type TableSearchProps = {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
};

const TableSearch = ({ searchTerm, setSearchTerm }: TableSearchProps) => {
  return (
    <div className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
      <Image src="/search.png" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder="Pesquisar..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} // Update search term on input change
        className="w-[200px] p-2 bg-transparent outline-none"
      />
    </div>
  );
};

export default TableSearch;
