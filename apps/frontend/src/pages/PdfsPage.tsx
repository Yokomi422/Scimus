import { useEffect, useState } from "react";
import type { FileRecord } from "@scimus/shared-types";
import axios from "axios";
import { toast } from "sonner";
import { RefreshCw, Download, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PdfsPage() {
  const [pdfs, setPdfs] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchPdfs = async (showToast = false) => {
    try {
      setRefreshing(true);
      const response = await axios.get<{ success: boolean; data: FileRecord[] }>(
        "http://localhost:3001/api/v1/files?type=pdf"
      );

      if (response.data.success) {
        setPdfs(response.data.data);
        if (showToast) {
          toast.success("PDF一覧を更新しました");
        }
      }
    } catch (error) {
      console.error("Error fetching PDFs:", error);
      toast.error("PDF一覧の取得に失敗しました");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  const handleDelete = async (pdfId: number) => {
    if (!confirm("このPDFを削除しますか？")) return;

    try {
      const response = await axios.delete(
        `http://localhost:3001/api/v1/files/${pdfId}`
      );

      if (response.data.success) {
        toast.success("PDFを削除しました");
        fetchPdfs();
      }
    } catch (error) {
      console.error("Error deleting PDF:", error);
      toast.error("PDFの削除に失敗しました");
    }
  };

  const handleDownload = async (pdf: FileRecord) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/v1/files/${pdf.id}/download`
      );

      if (response.data.downloadUrl) {
        const link = document.createElement("a");
        link.href = response.data.downloadUrl;
        link.download = pdf.originalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("ダウンロードを開始しました");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("ダウンロードに失敗しました");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      completed: { text: "完了", color: "bg-green-100 text-green-700" },
      pending: { text: "待機中", color: "bg-yellow-100 text-yellow-700" },
      processing: { text: "処理中", color: "bg-blue-100 text-blue-700" },
      failed: { text: "失敗", color: "bg-red-100 text-red-700" },
    };

    const statusInfo = statusMap[status] || { text: status, color: "bg-gray-100 text-gray-700" };

    return (
      <span className={`inline-block rounded px-2 py-1 text-xs ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PDFs</h1>
            <p className="mt-2 text-gray-600">PDFドキュメント</p>
          </div>
          <button
            onClick={() => fetchPdfs(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            更新
          </button>
        </div>

        {/* PDFs Grid */}
        {pdfs.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">PDFがありません</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="mb-2 truncate text-lg font-semibold text-gray-900">
                    {pdf.originalFilename}
                  </h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(pdf.processingStatus)}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                    <span>{formatFileSize(pdf.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDate(pdf.uploadedAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/preview/${pdf.id}`)}
                    className="flex items-center justify-center gap-2 rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                  >
                    <Eye className="h-4 w-4" />
                    プレビュー
                  </button>
                  <button
                    onClick={() => handleDownload(pdf)}
                    className="flex items-center justify-center rounded bg-indigo-600 p-2 text-white hover:bg-indigo-700"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(pdf.id)}
                    className="rounded bg-red-600 p-2 text-white hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
