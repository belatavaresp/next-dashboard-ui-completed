const Pagination = ({
  totalUsers,
  usersPerPage,
  currentPage,
  setCurrentPage,
}: {
  totalUsers: number;
  usersPerPage: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const totalPages = Math.ceil(totalUsers / usersPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <button
          key={i}
          className={`px-2 rounded-sm ${currentPage === i ? "bg-lime-200" : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  return (
    <div className="p-4 flex items-center justify-between text-gray-500">
      <button
        disabled={currentPage === 1}
        className="py-2 px-4 rounded-md bg-zinc-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handlePrevPage}
      >
        Prev
      </button>
      <div className="flex items-center gap-2 text-sm">{renderPageNumbers()}</div>
      <button
        disabled={currentPage === totalPages}
        className="py-2 px-4 rounded-md bg-zinc-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleNextPage}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
