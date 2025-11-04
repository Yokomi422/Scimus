import { useState } from 'react';
import type { PdfFile } from '@scimus/shared-types';
import axios, { type AxiosProgressEvent, type CancelTokenSource } from 'axios';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface PdfFileCardProps {
  file: PdfFile;
  onDelete?: (id: number) => void;
}

interface DownloadProgress {
  progress: number;
  status: 'idle' | 'downloading' | 'success' | 'error';
  error?: string;
  cancelTokenSource?: CancelTokenSource;
  startTime?: number;
  downloadedBytes?: number;
  estimatedTimeRemaining?: number;
}

export default function PdfFileCard({ file, onDelete }: PdfFileCardProps) {
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    progress: 0,
    status: 'idle',
  });

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return `約${Math.ceil(seconds)}秒`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `約${minutes}分${remainingSeconds > 0 ? remainingSeconds + '秒' : ''}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
            完了
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded">
            待機中
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
            処理中
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded">
            失敗
          </span>
        );
      default:
        return null;
    }
  };

  const handleDownload = async () => {
    const cancelTokenSource = axios.CancelToken.source();
    const startTime = Date.now();

    setDownloadProgress({
      progress: 0,
      status: 'downloading',
      cancelTokenSource,
      startTime,
      downloadedBytes: 0,
    });

    try {
      // Get download URL from backend
      const urlResponse = await axios.get(
        `http://localhost:3001/api/v1/files/${file.id}/download`
      );

      if (!urlResponse.data.success || !urlResponse.data.downloadUrl) {
        throw new Error('ダウンロードURLの取得に失敗しました');
      }

      const downloadUrl = urlResponse.data.downloadUrl;

      // Download file with progress tracking
      const response = await axios.get(downloadUrl, {
        responseType: 'blob',
        cancelToken: cancelTokenSource.token,
        onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            const currentTime = Date.now();
            const elapsedTime = (currentTime - startTime) / 1000;
            const downloadSpeed = progressEvent.loaded / elapsedTime;
            const remainingBytes = progressEvent.total - progressEvent.loaded;
            const estimatedTimeRemaining = remainingBytes / downloadSpeed;

            setDownloadProgress({
              progress: percentCompleted,
              status: 'downloading',
              cancelTokenSource,
              startTime,
              downloadedBytes: progressEvent.loaded,
              estimatedTimeRemaining: estimatedTimeRemaining > 0 ? estimatedTimeRemaining : undefined,
            });
          }
        },
      });

      // Create blob and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadProgress({
        progress: 100,
        status: 'success',
      });

      toast.success(`${file.originalFilename} のダウンロードが完了しました`);
    } catch (error: any) {
      if (axios.isCancel(error)) {
        setDownloadProgress({
          progress: 0,
          status: 'idle',
        });
        toast.info('ダウンロードをキャンセルしました');
        return;
      }

      const errorMessage =
        error?.message || 'ダウンロード中にエラーが発生しました';

      setDownloadProgress({
        progress: 0,
        status: 'error',
        error: errorMessage,
      });

      toast.error(`${file.originalFilename} のダウンロードに失敗しました`, {
        description: errorMessage,
      });
    }
  };

  const handleCancelDownload = () => {
    if (downloadProgress.cancelTokenSource && downloadProgress.status === 'downloading') {
      downloadProgress.cancelTokenSource.cancel('ダウンロードがキャンセルされました');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`${file.originalFilename} を削除しますか?`)) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:3001/api/v1/files/${file.id}`
      );

      if (response.data.success) {
        toast.success(`${file.originalFilename} を削除しました`);
        onDelete?.(file.id);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || '削除に失敗しました';
      toast.error(`削除エラー`, { description: errorMessage });
    }
  };

  const isDownloading = downloadProgress.status === 'downloading';

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* PDF Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-7 h-7 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.originalFilename}
              </p>
              {getStatusBadge(file.processingStatus)}
            </div>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
            </p>

            {/* Download Progress */}
            {isDownloading && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">
                    ダウンロード中... {downloadProgress.progress}%
                  </span>
                  {downloadProgress.estimatedTimeRemaining !== undefined &&
                    downloadProgress.estimatedTimeRemaining > 1 && (
                      <span className="text-xs text-gray-500">
                        残り {formatTimeRemaining(downloadProgress.estimatedTimeRemaining)}
                      </span>
                    )}
                </div>
                <Progress value={downloadProgress.progress} className="h-2" />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="ml-3 flex items-center space-x-2">
          {isDownloading ? (
            <button
              onClick={handleCancelDownload}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              aria-label="キャンセル"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : (
            <>
              <button
                onClick={handleDownload}
                className="p-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                aria-label="ダウンロード"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                aria-label="削除"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
