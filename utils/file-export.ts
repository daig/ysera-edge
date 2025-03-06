import JSZip from "jszip"
import { saveAs } from "file-saver"

export type ExportData = {
  experimentDescription: string
  methodsSection?: string
  audioBlob?: Blob
  createdAt: Date
}

export async function exportToZip(data: ExportData): Promise<void> {
  try {
    const zip = new JSZip()

    // Add experiment description as text file
    if (data.experimentDescription) {
      zip.file("experiment-description.txt", data.experimentDescription)
    }

    // Add methods section as text file if available
    if (data.methodsSection) {
      zip.file("methods-section.txt", data.methodsSection)
    }

    // Add audio recording if available
    if (data.audioBlob) {
      zip.file("audio-recording.wav", data.audioBlob)
    }

    // Add metadata file with creation date
    const metadata = {
      createdAt: data.createdAt.toISOString(),
      hasAudio: !!data.audioBlob,
      hasMethodsSection: !!data.methodsSection,
    }

    zip.file("metadata.json", JSON.stringify(metadata, null, 2))

    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" })

    // Create a filename with date
    const dateStr = new Date().toISOString().split("T")[0]
    const filename = `research-methods-${dateStr}.zip`

    // Save the file to disk
    saveAs(zipBlob, filename)

    return Promise.resolve()
  } catch (error) {
    console.error("Error creating zip file:", error)
    return Promise.reject(error)
  }
}

