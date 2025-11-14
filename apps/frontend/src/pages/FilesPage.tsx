import { useEffect, useState } from "react";
import type { FileRecord } from "@scimus/shared-types";
import axios from "axios";
import { toast } from "sonner";
import { RefreshCw, Download, Trash2 } from "lucide-react";

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFiles = async (showToast = false) => {
    try {
      setRefreshing(true);
      const response = await axios.get<{ success: boolean; data: FileRecord[] }>(
        "http://localhost:3001/api/v1/files"
      );

      if (response.data.success) {
        // Filter out PDFs and images (they have their own pages)
        const filteredFiles = response.data.data.filter(
          (file) => file.fileType !== "pdf" && file.fileType !== "image"
        );
        setFiles(filteredFiles);
        if (showToast) {
          toast.success("ファイル一覧を更新しました");
        }
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("ファイル一覧の取得に失敗しました");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (fileId: number) => {
    if (!confirm("このファイルを削除しますか？")) return;

    try {
      const response = await axios.delete(
        `http://localhost:3001/api/v1/files/${fileId}`
      );

      if (response.data.success) {
        toast.success("ファイルを削除しました");
        fetchFiles();
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("ファイルの削除に失敗しました");
    }
  };

  const handleDownload = async (file: FileRecord) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/v1/files/${file.id}/download`
      );

      if (response.data.downloadUrl) {
        window.open(response.data.downloadUrl, "_blank");
        toast.success("ダウンロードを開始しました");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
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
            <h1 className="text-3xl font-bold text-gray-900">Files</h1>
            <p className="mt-2 text-gray-600">
              すべてのファイル (PDFと画像を除く)
            </p>
          </div>
          <button
            onClick={() => fetchFiles(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            更新
          </button>
        </div>

        {/* Files Grid */}
        {files.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">ファイルがありません</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="truncate text-lg font-semibold text-gray-900">
                    {file.originalFilename}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDate(file.uploadedAt)}</span>
                  </div>
                  <div className="mt-2">
                    <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {file.fileType || "other"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="flex flex-1 items-center justify-center gap-2 rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
                  >
                    <Download className="h-4 w-4" />
                    ダウンロード
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
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
