import { Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import Home from "@/pages/Home"
import PdfPreview from "@/pages/PdfPreview"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/preview/:fileId" element={<PdfPreview />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
