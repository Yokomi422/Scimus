import { useState, useEffect } from 'react';
import axios from 'axios';
import type { PdfFile } from '@scimus/shared-types';
import PdfFileCard from './PdfFileCard';
import { toast } from 'sonner';

export default function PdfFileList() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFiles = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await axios.get('http://localhost:3001/api/v1/files');

      if (response.data.success) {
        setFiles(response.data.data || []);
      } else {
        setError(response.data.message || 'ファイルの取得に失敗しました');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'ファイルの取得に失敗しました';
      setError(errorMessage);
      if (!isRefresh) {
        toast.error('エラー', { description: errorMessage });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFiles();

    // カスタムイベントリスナーを追加してアップロード完了時にリフレッシュ
    const handleFileUploaded = () => {
      fetchFiles(true);
    };

    window.addEventListener('fileUploaded', handleFileUploaded);

    return () => {
      window.removeEventListener('fileUploaded', handleFileUploaded);
    };
  }, []);

  const handleDelete = (id: number) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 mr-3"
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
            <div>
              <p className="text-sm font-medium text-red-800">エラーが発生しました</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchFiles()}
                className="mt-3 text-sm text-red-700 hover:text-red-800 font-medium underline"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <svg
            className="mx-auto w-16 h-16 text-gray-400 mb-4"
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
          <p className="text-gray-600 text-lg mb-2">アップロードされたファイルがありません</p>
          <p className="text-gray-500 text-sm">
            PDFファイルをアップロードすると、ここに表示されます
          </p>
        </div>
      </div>
    );
  }

  // 最大4件まで表示（最新順）
  const recentFiles = files.slice(0, 4);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recent</h2>
          <p className="text-sm text-gray-600 mt-1">
            {recentFiles.length}件表示中 {files.length > 4 && `/ ${files.length}件中`}
          </p>
        </div>
        <button
          onClick={() => fetchFiles(true)}
          disabled={refreshing}
          className="p-2 text-gray-600 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="更新"
        >
          <svg
            className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {recentFiles.map((file) => (
          <PdfFileCard key={file.id} file={file} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
