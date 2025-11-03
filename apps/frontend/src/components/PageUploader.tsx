import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { useState, useEffect } from 'react';
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { Progress } from '@/components/ui/progress';

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  uppyFileId?: string;
}

export default function PageUploader() {
  const [files, setFiles] = useState<File[] | undefined>();
  const [uploadProgress, setUploadProgress] = useState<Map<string, FileUploadProgress>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [uppy, setUppy] = useState<Uppy | null>(null);

  useEffect(() => {
    // Uppyインスタンスの初期化
    const uppyInstance = new Uppy({
      restrictions: {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedFileTypes: ['application/pdf'],
        maxNumberOfFiles: 5,
      },
      autoProceed: false,
    });

    // Tusプラグインの設定
    // TODO: バックエンドのTusエンドポイントを実装後に有効化
    /*
    uppyInstance.use(Tus, {
      endpoint: 'http://localhost:3001/api/v1/upload',
      retryDelays: [0, 1000, 3000, 5000],
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
      removeFingerprintOnSuccess: true,
    });
    */

    setUppy(uppyInstance);

    return () => {
      uppyInstance.cancelAll();
      uppyInstance.clear();
    };
  }, []);

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
      if (progressInfo?.uppyFileId && uppy) {
        uppy.removeFile(progressInfo.uppyFileId);
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
    if (progressInfo?.uppyFileId && uppy) {
      uppy.removeFile(progressInfo.uppyFileId);
      setUploadProgress((prev) => {
        const newMap = new Map(prev);
        newMap.set(fileName, {
          ...progressInfo,
          status: 'idle',
          progress: 0,
        });
        return newMap;
      });
    }
  };

  const getErrorMessage = (error: Error | string): string => {
    const message = typeof error === 'string' ? error : error.message;

    if (message.includes('413')) {
      return 'ファイルサイズが大きすぎます。100MB以下のファイルをアップロードしてください。';
    }
    if (message.includes('415')) {
      return 'PDFファイルのみアップロード可能です。';
    }
    if (message.includes('429')) {
      return 'アップロードの制限に達しました。しばらく待ってから再試行してください。';
    }
    if (message.includes('500') || message.includes('503')) {
      return 'サーバーエラーが発生しました。しばらく待ってから再試行してください。';
    }

    return message || 'アップロード中にエラーが発生しました。';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ドキュメントをアップロード</h2>
        <p className="text-sm text-gray-600">
          PDFファイルをアップロードして分析し、知識を抽出します。最大5ファイル、各100MBまで。
        </p>
      </div>

      <Dropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        maxFiles={5}
        maxSize={100 * 1024 * 1024}
        multiple={true}
        onDrop={handleDrop}
        onError={handleError}
        src={files}
        className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 transition-colors rounded-lg bg-indigo-50/30"
      >
        <DropzoneEmptyState />
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
                            </div>
                            <Progress value={progressInfo.progress} className="h-2" />
                          </div>
                        )}

                        {/* エラーメッセージ */}
                        {isError && progressInfo?.error && (
                          <div className="mt-2">
                            <p className="text-xs text-red-600">{getErrorMessage(progressInfo.error)}</p>
                            <button
                              className="mt-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                              onClick={() => {
                                // 再試行ロジック（後で実装）
                                console.log('Retry upload:', file.name);
                              }}
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
            onClick={() => {
              // TODO: 実際のアップロード処理を実装
              console.log('Process files:', files);
            }}
            disabled={Array.from(uploadProgress.values()).some(p => p.status === 'uploading')}
          >
            {files.length}件のドキュメントを処理
          </button>
        </div>
      )}
    </div>
  );
}