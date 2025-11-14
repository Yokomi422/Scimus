import { Dropzone, DropzoneContent } from '@/components/ui/shadcn-io/dropzone';
import { useState } from 'react';
import axios, { type AxiosProgressEvent, type CancelTokenSource } from 'axios';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  cancelTokenSource?: CancelTokenSource;
  startTime?: number;
  uploadedBytes?: number;
  estimatedTimeRemaining?: number;
}

type SourceFilter = 'all' | 'notes' | 'pdfs';

export default function PageUploader() {
  const [files, setFiles] = useState<File[] | undefined>();
  const [uploadProgress, setUploadProgress] = useState<Map<string, FileUploadProgress>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles((prev) => {
      const combined = [...(prev || []), ...acceptedFiles];
      // 最大5ファイルまで
      return combined.slice(0, 5);
    });
    setError(null);

    // アップロード進捗の初期化
    acceptedFiles.forEach((file) => {
      setUploadProgress((prev) => {
        const newMap = new Map(prev);
        newMap.set(file.name, {
          file,
          progress: 0,
          status: 'idle',
        });
        return newMap;
      });
    });
  };

  const handleError = (error: Error) => {
    setError(error.message);
  };

  const handleRemoveFile = (fileIndex: number) => {
    const fileToRemove = files?.[fileIndex];
    if (fileToRemove) {
      // アップロード中の場合はキャンセル
      const progressInfo = uploadProgress.get(fileToRemove.name);
      if (progressInfo?.cancelTokenSource && progressInfo.status === 'uploading') {
        progressInfo.cancelTokenSource.cancel('アップロードがキャンセルされました');
      }

      setUploadProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(fileToRemove.name);
        return newMap;
      });
    }

    setFiles((prev) => prev?.filter((_, index) => index !== fileIndex));
  };

  const handleCancelUpload = (fileName: string) => {
    const progressInfo = uploadProgress.get(fileName);
    if (progressInfo?.cancelTokenSource && progressInfo.status === 'uploading') {
      progressInfo.cancelTokenSource.cancel('アップロードがキャンセルされました');
      setUploadProgress((prev) => {
        const newMap = new Map(prev);
        newMap.set(fileName, {
          ...progressInfo,
          status: 'idle',
          progress: 0,
          cancelTokenSource: undefined,
          startTime: undefined,
          uploadedBytes: undefined,
          estimatedTimeRemaining: undefined,
        });
        return newMap;
      });
      toast.info(`${fileName} のアップロードをキャンセルしました`);
    }
  };

  const getErrorMessage = (error: any): string => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 413) {
        return 'ファイルサイズが大きすぎます。100MB以下のファイルをアップロードしてください。';
      }
      if (status === 415) {
        return 'PDFファイルのみアップロード可能です。';
      }
      if (status === 429) {
        return 'アップロードの制限に達しました。しばらく待ってから再試行してください。';
      }
      if (status === 500 || status === 503) {
        return 'サーバーエラーが発生しました。しばらく待ってから再試行してください。';
      }
    }

    const message = error?.message || String(error);
    if (message.includes('cancel')) {
      return 'アップロードがキャンセルされました。';
    }

    return message || 'アップロード中にエラーが発生しました。';
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return `約${Math.ceil(seconds)}秒`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `約${minutes}分${remainingSeconds > 0 ? remainingSeconds + '秒' : ''}`;
  };

  const uploadFile = async (file: File) => {
    const cancelTokenSource = axios.CancelToken.source();
    const startTime = Date.now();

    setUploadProgress((prev) => {
      const newMap = new Map(prev);
      newMap.set(file.name, {
        file,
        progress: 0,
        status: 'uploading',
        cancelTokenSource,
        startTime,
        uploadedBytes: 0,
      });
      return newMap;
    });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:3001/api/v1/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        cancelToken: cancelTokenSource.token,
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const currentTime = Date.now();
            const elapsedTime = (currentTime - startTime) / 1000; // 秒単位
            const uploadSpeed = progressEvent.loaded / elapsedTime; // bytes/sec
            const remainingBytes = progressEvent.total - progressEvent.loaded;
            const estimatedTimeRemaining = remainingBytes / uploadSpeed; // 秒

            setUploadProgress((prev) => {
              const newMap = new Map(prev);
              const current = newMap.get(file.name);
              if (current && current.status === 'uploading') {
                newMap.set(file.name, {
                  ...current,
                  progress: percentCompleted,
                  uploadedBytes: progressEvent.loaded,
                  estimatedTimeRemaining: estimatedTimeRemaining > 0 ? estimatedTimeRemaining : undefined,
                });
              }
              return newMap;
            });
          }
        },
      });

      setUploadProgress((prev) => {
        const newMap = new Map(prev);
        newMap.set(file.name, {
          file,
          progress: 100,
          status: 'success',
        });
        return newMap;
      });

      toast.success(`${file.name} のアップロードが完了しました`);

      // ファイルリストを更新するためのカスタムイベントを発火
      window.dispatchEvent(new Event('fileUploaded'));

      return response.data;
    } catch (error: any) {
      if (axios.isCancel(error)) {
        // キャンセルされた場合は何もしない（handleCancelUploadで処理済み）
        return;
      }

      const errorMessage = getErrorMessage(error);

      setUploadProgress((prev) => {
        const newMap = new Map(prev);
        newMap.set(file.name, {
          file,
          progress: 0,
          status: 'error',
          error: errorMessage,
        });
        return newMap;
      });

      // sonnerで再試行アクション付きエラー通知
      toast.error(`${file.name} のアップロードに失敗しました`, {
        description: errorMessage,
        action: {
          label: '再試行',
          onClick: () => handleRetryUpload(file),
        },
      });

      throw error;
    }
  };

  const handleRetryUpload = async (file: File) => {
    setUploadProgress((prev) => {
      const newMap = new Map(prev);
      newMap.set(file.name, {
        file,
        progress: 0,
        status: 'idle',
      });
      return newMap;
    });

    try {
      await uploadFile(file);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const handleProcessFiles = async () => {
    if (!files || files.length === 0) return;

    toast.info(`${files.length}件のドキュメントをアップロード中...`);

    for (const file of files) {
      const progressInfo = uploadProgress.get(file.name);
      // idleまたはerrorのファイルのみアップロード
      if (!progressInfo || progressInfo.status === 'idle' || progressInfo.status === 'error') {
        try {
          await uploadFile(file);
        } catch (error) {
          // エラーは個別に処理されるため、ここでは何もしない
        }
      }
    }

    // すべて成功したかチェック
    const allSuccess = files.every(file => {
      const info = uploadProgress.get(file.name);
      return info?.status === 'success';
    });

    if (allSuccess) {
      toast.success('すべてのドキュメントのアップロードが完了しました！');
    }
  };

  const isUploading = Array.from(uploadProgress.values()).some(p => p.status === 'uploading');

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="text"
            placeholder="Search your content"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {/* Source Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Source:</span>
          <div className="flex gap-2">
            <Button
              variant={sourceFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSourceFilter('all')}
              className={cn(
                'rounded-full px-4',
                sourceFilter === 'all' && 'bg-indigo-600 hover:bg-indigo-700'
              )}
            >
              All
            </Button>
            <Button
              variant={sourceFilter === 'notes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSourceFilter('notes')}
              className={cn(
                'rounded-full px-4',
                sourceFilter === 'notes' && 'bg-indigo-600 hover:bg-indigo-700'
              )}
            >
              Notes
            </Button>
            <Button
              variant={sourceFilter === 'pdfs' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSourceFilter('pdfs')}
              className={cn(
                'rounded-full px-4',
                sourceFilter === 'pdfs' && 'bg-indigo-600 hover:bg-indigo-700'
              )}
            >
              PDFs
            </Button>
          </div>
        </div>
      </div>

      {/* Dotted Line Separator */}
      <div className="mb-6 border-t border-dashed border-gray-300" />

      {/* Start Uploading Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Start Uploading</h2>
        <div className="flex gap-3">
          {/* PDF Button with Hover Tooltip */}
          <div className="relative group">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {
                // Handle upload PDF action
              }}
            >
              <svg
                className="w-5 h-5 text-gray-600"
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
              <span className="font-medium text-gray-700">PDF</span>
            </button>

            {/* Hover Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
              Upload PDF
            </div>
          </div>

          {/* Note Button with Hover Tooltip */}
          <div className="relative group">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {
                // Handle create note action
              }}
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="font-medium text-gray-700">Note</span>
            </button>

            {/* Hover Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
              Create New Note
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <Dropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        maxFiles={5}
        maxSize={100 * 1024 * 1024}
        multiple={true}
        onDrop={handleDrop}
        onError={handleError}
        src={files}
        className="border-2 border-dashed border-gray-300 hover:border-indigo-500 transition-colors rounded-lg bg-gray-50/50 min-h-[200px] flex items-center justify-center"
      >
        <div className="text-center p-8">
          <p className="text-base text-gray-700 mb-2">Paste or drag & drop a file here</p>
          <p className="text-sm text-gray-400">File types supported: PDF, TXT, JPG, PNG, MD</p>
        </div>
        <DropzoneContent />
      </Dropzone>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <span className="font-semibold">エラー: </span>
            {error}
          </p>
        </div>
      )}

      {files && files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">アップロードされたファイル</h3>
          <div className="space-y-3">
            {files.map((file, index) => {
              const progressInfo = uploadProgress.get(file.name);
              const isUploading = progressInfo?.status === 'uploading';
              const isSuccess = progressInfo?.status === 'success';
              const isError = progressInfo?.status === 'error';

              return (
                <div
                  key={`${file.name}-${index}`}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        {isSuccess ? (
                          <svg
                            className="w-6 h-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : isError ? (
                          <svg
                            className="w-6 h-6 text-red-600"
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
                        ) : (
                          <svg
                            className="w-6 h-6 text-indigo-600"
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
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>

                        {/* 進捗バー */}
                        {isUploading && progressInfo && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">
                                アップロード中... {progressInfo.progress}%
                              </span>
                              {progressInfo.estimatedTimeRemaining !== undefined && progressInfo.estimatedTimeRemaining > 1 && (
                                <span className="text-xs text-gray-500">
                                  残り {formatTimeRemaining(progressInfo.estimatedTimeRemaining)}
                                </span>
                              )}
                            </div>
                            <Progress value={progressInfo.progress} className="h-2" />
                          </div>
                        )}

                        {/* エラーメッセージ */}
                        {isError && progressInfo?.error && (
                          <div className="mt-2">
                            <p className="text-xs text-red-600">{progressInfo.error}</p>
                            <button
                              className="mt-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                              onClick={() => handleRetryUpload(file)}
                            >
                              再試行
                            </button>
                          </div>
                        )}

                        {/* 成功メッセージ */}
                        {isSuccess && (
                          <p className="mt-1 text-xs text-green-600">アップロード完了</p>
                        )}
                      </div>
                    </div>

                    {/* 削除/キャンセルボタン */}
                    <div className="ml-3 flex-shrink-0">
                      {isUploading ? (
                        <button
                          onClick={() => handleCancelUpload(file.name)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          aria-label={`キャンセル ${file.name}`}
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
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          aria-label={`削除 ${file.name}`}
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
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            className="mt-4 w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleProcessFiles}
            disabled={isUploading}
          >
            {files.length}件のドキュメントを処理
          </button>
        </div>
      )}
    </div>
  );
}
