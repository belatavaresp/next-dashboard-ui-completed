"use client";

import { useState } from "react";

type PDFViewerProps = {
  activityBookLink?: string;
  guideLink?: string;
  extraLink?: string;
  /** Only provided for teachers and admins. */
  teacherGuideLink?: string;
};

const PDFViewer: React.FC<PDFViewerProps> = ({
  activityBookLink,
  guideLink,
  extraLink,
  teacherGuideLink,
}) => {
  const embeddable = [activityBookLink, guideLink, teacherGuideLink].filter(
    (link): link is string => Boolean(link)
  );
  const [currentPDF, setCurrentPDF] = useState(embeddable[0]);

  const buttonClass =
    "rounded-lg bg-white px-6 py-3 shadow-md hover:bg-zinc-100 text-zinc-500";

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Buttons to switch between activity items */}
      <div className="flex justify-center gap-4 mb-3 flex-wrap">
        {activityBookLink && (
          <button className={buttonClass} onClick={() => setCurrentPDF(activityBookLink)}>
            Conteúdo
          </button>
        )}
        {guideLink && (
          <button className={buttonClass} onClick={() => setCurrentPDF(guideLink)}>
            Guia de Montagem
          </button>
        )}
        {teacherGuideLink && (
          <button className={buttonClass} onClick={() => setCurrentPDF(teacherGuideLink)}>
            Apoio ao professor
          </button>
        )}
        {extraLink && (
          <button className={buttonClass} onClick={() => window.open(extraLink, "_blank")}>
            Conteúdo extra
          </button>
        )}
      </div>

      {currentPDF ? (
        <iframe src={currentPDF} width="90%" height="700px" title="PDF Viewer" />
      ) : (
        <p className="text-gray-500">Nenhum material disponível para esta atividade.</p>
      )}
    </div>
  );
};

export default PDFViewer;
