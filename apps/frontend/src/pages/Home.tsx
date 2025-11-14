import PageUploader from "@/components/PageUploader"
import PdfFileList from "@/components/PdfFileList"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageUploader />
      <PdfFileList />
    </div>
  )
}
