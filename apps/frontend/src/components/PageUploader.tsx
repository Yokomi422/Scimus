import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { useState } from 'react';

export default function PageUploader() {
  const [files, setFiles] = useState<File[] | undefined>();
  const [error, setError] = useState<string | null>(null);

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles((prev) => {
      const combined = [...(prev || []), ...acceptedFiles];
      // 最大5ファイルまで
      return combined.slice(0, 5);
    });
    setError(null);
  };

  const handleError = (error: Error) => {
    setError(error.message);
  };

  const handleRemoveFile = (fileIndex: number) => {
    setFiles((prev) => prev?.filter((_, index) => index !== fileIndex));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ドキュメントをアップロード</h2>
        <p className="text-sm text-gray-600">
          PDFファイルをアップロードして分析し、知識を抽出します。最大5ファイル、各20MBまで。
        </p>
      </div>

      <Dropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        maxFiles={5}
        maxSize={1024 * 1024 * 20}
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
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
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
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  aria-label={`Remove ${file.name}`}
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
              </div>
            ))}
          </div>
          <button
            className="mt-4 w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            onClick={() => console.log('Process files:', files)}
          >
            {files.length}件のドキュメントを処理
          </button>
        </div>
      )}
    </div>
  );
}