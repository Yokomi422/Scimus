import Header from "@/components/Header"
import PageUploader from "@/components/PageUploader"
import { Toaster } from "sonner"

function App() {
  return (
    <>
      <Header />
      <PageUploader />
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
