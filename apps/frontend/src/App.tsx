import { Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { Layout } from "@/components/Layout"
import Home from "@/pages/Home"
import PdfPreview from "@/pages/PdfPreview"
import FilesPage from "@/pages/FilesPage"
import NotesPage from "@/pages/NotesPage"
import ImagesPage from "@/pages/ImagesPage"
import PdfsPage from "@/pages/PdfsPage"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/files" element={<Layout><FilesPage /></Layout>} />
        <Route path="/notes" element={<Layout><NotesPage /></Layout>} />
        <Route path="/images" element={<Layout><ImagesPage /></Layout>} />
        <Route path="/pdfs" element={<Layout><PdfsPage /></Layout>} />
        <Route path="/preview/:fileId" element={<PdfPreview />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
