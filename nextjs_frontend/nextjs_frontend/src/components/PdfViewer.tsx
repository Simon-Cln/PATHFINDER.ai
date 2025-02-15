import React from 'react';

interface PdfViewerProps {
  pdfData: {
    filename: string;
    data: string;
  };
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfData }) => {
  const openFullscreen = () => {
    window.open(pdfData.data, '_blank', 'width=800,height=600');
  };

  return (
    <div className="pdf-preview">
      <embed
        src={pdfData.data}
        type="application/pdf"
        width="200"
        height="300"
        style={{ cursor: 'pointer' }}
        onClick={openFullscreen}
      />
    </div>
  );
};

export default PdfViewer;
