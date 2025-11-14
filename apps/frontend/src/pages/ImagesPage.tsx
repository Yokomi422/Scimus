import { useEffect, useState } from "react";
import type { FileRecord } from "@scimus/shared-types";
import axios from "axios";
import { toast } from "sonner";
import { RefreshCw, Download, Trash2, ZoomIn } from "lucide-react";

export default function ImagesPage() {
  const [images, setImages] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  const fetchImages = async (showToast = false) => {
    try {
      setRefreshing(true);
      const response = await axios.get<{ success: boolean; data: FileRecord[] }>(
        "http://localhost:3001/api/v1/files?type=image"
      );

      if (response.data.success) {
        setImages(response.data.data);
        if (showToast) {
          toast.success("画像一覧を更新しました");
        }
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      toast.error("画像一覧の取得に失敗しました");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleDelete = async (imageId: number) => {
    if (!confirm("この画像を削除しますか？")) return;

    try {
      const response = await axios.delete(
        `http://localhost:3001/api/v1/files/${imageId}`
      );

      if (response.data.success) {
        toast.success("画像を削除しました");
        fetchImages();
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("画像の削除に失敗しました");
    }
  };

  const handleDownload = async (image: FileRecord) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/v1/files/${image.id}/download`
      );

      if (response.data.downloadUrl) {
        const link = document.createElement("a");
        link.href = response.data.downloadUrl;
        link.download = image.originalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("ダウンロードを開始しました");
      }
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("ダウンロードに失敗しました");
    }
  };

  const handlePreview = async (image: FileRecord) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/v1/files/${image.id}/download`
      );

      if (response.data.downloadUrl) {
        setSelectedImage({ url: response.data.downloadUrl, name: image.originalFilename });
      }
    } catch (error) {
      console.error("Error previewing image:", error);
      toast.error("プレビューの取得に失敗しました");
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
            <h1 className="text-3xl font-bold text-gray-900">Images</h1>
            <p className="mt-2 text-gray-600">画像ファイル (JPG, PNG, GIF, etc.)</p>
          </div>
          <button
            onClick={() => fetchImages(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            更新
          </button>
        </div>

        {/* Images Grid */}
        {images.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">画像がありません</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image Preview Placeholder */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <button
                    onClick={() => handlePreview(image)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ZoomIn className="h-12 w-12" />
                  </button>
                </div>

                {/* Image Info */}
                <div className="p-4">
                  <h3 className="truncate text-sm font-semibold text-gray-900">
                    {image.originalFilename}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatFileSize(image.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDate(image.uploadedAt)}</span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleDownload(image)}
                      className="flex flex-1 items-center justify-center gap-1 rounded bg-indigo-600 px-2 py-1.5 text-xs text-white hover:bg-indigo-700"
                    >
                      <Download className="h-3 w-3" />
                      ダウンロード
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="rounded bg-red-600 p-1.5 text-white hover:bg-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image Preview Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="max-h-[90vh] max-w-[90vw]">
              <div className="mb-4 text-center">
                <h3 className="text-lg font-semibold text-white">{selectedImage.name}</h3>
              </div>
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="max-h-[80vh] max-w-full rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="mt-4 text-center">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="rounded-lg bg-white px-4 py-2 text-gray-900 hover:bg-gray-100"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
