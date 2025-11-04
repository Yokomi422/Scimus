import Header from "@/components/Header"
import PageUploader from "@/components/PageUploader"
import PdfFileList from "@/components/PdfFileList"
import { Toaster } from "sonner"

function App() {
  return (
    <>
      <Header />
      <PageUploader />
      <PdfFileList />
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
