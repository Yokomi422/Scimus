import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import type { DownloadUrlResponse } from '@scimus/shared-types';
import PDFViewer from '@/components/PDFViewer';

export default function PdfPreview() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPdf() {
      if (!fileId) {
        setError('ファイルIDが指定されていません');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get download URL from backend
        const urlResponse = await axios.get<DownloadUrlResponse>(
          `http://localhost:3001/api/v1/files/${fileId}/download`
        );

        if (!urlResponse.data.success || !urlResponse.data.downloadUrl) {
          throw new Error('ダウンロードURLの取得に失敗しました');
        }

        const downloadUrl = urlResponse.data.downloadUrl;

        // Download the PDF file as blob
        const pdfResponse = await axios.get(downloadUrl, {
          responseType: 'blob',
        });

        // Create blob URL for PDF.js
        const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'PDFの読み込みに失敗しました';
        setError(errorMessage);
        toast.error('エラー', { description: errorMessage });
      } finally {
        setLoading(false);
      }
    }

    loadPdf();

    // Cleanup: revoke blob URL when component unmounts
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [fileId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-lg">PDFを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full">
          <div className="p-6 bg-white border border-red-200 rounded-lg shadow-sm">
            <div className="flex items-start mb-4">
              <svg
                className="w-6 h-6 text-red-600 mt-0.5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-base font-medium text-red-800 mb-2">
                  エラーが発生しました
                </p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PDFViewer url={pdfUrl} onClose={() => navigate('/')} />
    </div>
  );
}
