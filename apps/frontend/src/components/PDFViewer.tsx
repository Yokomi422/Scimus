import { useState, useRef, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js Worker設定
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  url: string;
  onClose?: () => void;
}

export default function PDFViewer({ url, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageWidth, setPageWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Update page width based on container size
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setPageWidth(Math.min(containerWidth - 40, 1200)); // Max 1200px
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);

      // Scroll to the specific page element
      const pageElement = pageRefs.current[page];
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  // Memoize options to prevent unnecessary reloads
  const documentOptions = useMemo(() => ({
    cMapUrl: '/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/standard_fonts/',
  }), []);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="閉じる"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-semibold text-gray-900">PDFプレビュー</h1>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => goToPage(pageNumber - 1)}
              disabled={pageNumber <= 1}
              className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-100 rounded transition-colors"
              aria-label="前のページ"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="px-3 py-1 bg-gray-100 rounded text-sm font-medium text-gray-700">
              {pageNumber} / {numPages || '...'}
            </div>

            <button
              onClick={() => goToPage(pageNumber + 1)}
              disabled={pageNumber >= numPages}
              className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-100 rounded transition-colors"
              aria-label="次のページ"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-100 rounded transition-colors"
              aria-label="縮小"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>

            <button
              onClick={handleResetZoom}
              className="px-3 py-1 bg-gray-100 rounded text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-100 rounded transition-colors"
              aria-label="拡大"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-gray-100">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 text-lg">PDFを読み込み中...</p>
              </div>
            </div>
          }
          error={
            <div className="h-full flex items-center justify-center p-6">
              <div className="max-w-md p-6 bg-white border border-red-200 rounded-lg shadow-sm">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-base font-medium text-red-800 mb-2">PDFの読み込みに失敗しました</p>
                    <p className="text-sm text-red-700">ファイルが破損しているか、サポートされていない形式です。</p>
                  </div>
                </div>
              </div>
            </div>
          }
          options={documentOptions}
        >
          <div className="flex flex-col items-center py-4 space-y-4">
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page_${index + 1}`}
                ref={(el) => {
                  pageRefs.current[index + 1] = el;
                }}
                className="shadow-lg"
              >
                <Page
                  pageNumber={index + 1}
                  width={pageWidth * scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
          </div>
        </Document>
      </div>
    </div>
  );
}
