// components/PDFViewer.tsx
import { useState } from "react";

type PDFViewerProps = {
  contentLink: string;
  guideLink?: string;
  extraLink?: string;
};

const PDFViewer: React.FC<PDFViewerProps> = ({
  contentLink,
  guideLink,
  extraLink,
}) => {
  const [currentPDF, setCurrentPDF] = useState(contentLink);

  const handlePDFChange = (link: string) => {
    setCurrentPDF(link);
  };

  const handleExternalLink = (link: string) => {
    window.open(link, "_blank"); // Open in new tab
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Buttons to switch between activity items */}
      <div className="flex justify-center gap-4 mb-3">
        <button
          className="rounded-lg bg-white px-6 py-3 shadow-md hover:bg-zinc-100 text-zinc-500"
          onClick={() => handlePDFChange(contentLink)}
        >
          Conteúdo
        </button>
        {guideLink && (
          <button
            className="rounded-lg bg-white px-6 py-3 shadow-md hover:bg-zinc-100 text-zinc-500"
            onClick={() => handlePDFChange(guideLink)}
          >
            Guia de Montagem
          </button>
        )}
        {extraLink && (
          <button
            className="rounded-lg bg-white px-6 py-3 shadow-md hover:bg-zinc-100 text-zinc-500"
            onClick={() => handleExternalLink(extraLink)} // Open in new tab
          >
            Conteúdo extra
          </button>
        )}
      </div>

    <iframe
        src={currentPDF}
        width="90%" // Ajuste o tamanho do PDF conforme necessário
        height="700px"
        title="PDF Viewer"
    />
    </div>
  );
};

export default PDFViewer;
