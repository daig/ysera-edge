import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Set maxDuration to 60 seconds for transcription
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get("audio") as File | Blob

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
    }

    // Enhanced logging for debugging
    console.log(
      `Received audio file: ${(audioFile as any).name || "unnamed"}, size: ${audioFile.size} bytes, type: ${audioFile.type}`,
    )
    console.log(`Audio file is instance of File: ${audioFile instanceof File}`)

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    try {
      // Log before sending to OpenAI
      console.log(`Sending audio file to OpenAI Whisper API...`)

      // For non-File blobs, we need to convert to a File
      const fileToSend =
        audioFile instanceof File
          ? audioFile
          : new File([audioFile], "recording.wav", { type: audioFile.type || "audio/wav" })

      // Call OpenAI's Whisper API for transcription
      const transcription = await openai.audio.transcriptions.create({
        file: fileToSend,
        model: "whisper-1",
        response_format: "text",
        temperature: 0.2, // Lower temperature for more accurate transcription
      })

      console.log(`Transcription successful, length: ${transcription.length} characters`)
      console.log(`Transcription preview: "${transcription.substring(0, 100)}..."`)
      return NextResponse.json({ text: transcription })
    } catch (openaiError) {
      console.error("OpenAI transcription error:", openaiError)

      // More detailed error handling
      if (openaiError instanceof Error) {
        console.error("Error message:", openaiError.message)
        console.error("Error stack:", openaiError.stack)

        // Check if it's a file format error
        if (openaiError.message.includes("format")) {
          return NextResponse.json(
            { error: "Audio format not supported. Please try a different recording format." },
            { status: 400 },
          )
        }

        // Check if it's a file size error
        if (openaiError.message.includes("size")) {
          return NextResponse.json(
            { error: "Audio file too large. Please limit recordings to 25MB or 10 minutes." },
            { status: 400 },
          )
        }
      }

      throw openaiError
    }
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: "Failed to transcribe audio. Please try again." }, { status: 500 })
  }
}

