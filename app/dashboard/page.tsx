"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowRight, Mic, MicOff, Play, Download, Upload, StopCircle } from "lucide-react"
import AuthCheck from "@/components/auth-check"
import { exportToZip, type ExportData } from "@/utils/file-export"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function Dashboard() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Use the secure API route instead of direct AI SDK call
  const handleSubmit = async () => {
    if (!input.trim()) return

    setIsLoading(true)
    try {
      // Call our secure API route
      const response = await fetch("/api/generate-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      setOutput(data.text)
    } catch (error) {
      console.error("Error generating methods section:", error)
      setOutput("An error occurred while generating the methods section. Please try again.")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate methods section. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      // Clear previous recording data
      audioChunksRef.current = []

      // Get audio stream with higher quality settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Create MediaRecorder with default settings - this worked before
      const mediaRecorder = new MediaRecorder(stream)

      // Event handler for data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // Event handler for when recording stops
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })

        // Clean up previous URL if it exists
        if (audioURL) {
          URL.revokeObjectURL(audioURL)
        }

        // Create new URL for the audio blob
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioURL(audioUrl)

        // Store the blob for export and playback
        audioBlobRef.current = audioBlob

        // Start transcription with original recorded audio
        handleRecordingTranscription(audioBlob)
      }

      // Store the MediaRecorder reference
      mediaRecorderRef.current = mediaRecorder

      // Start recording - using original parameters
      mediaRecorder.start()
      setIsRecording(true)

      console.log("Recording started")
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Microphone Access Error",
        description: "Could not access microphone. Please check your browser permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        // Stop the MediaRecorder
        mediaRecorderRef.current.stop()
        setIsRecording(false)

        // Stop all audio tracks
        mediaRecorderRef.current.stream.getTracks().forEach((track) => {
          track.stop()
        })

        console.log("Recording stopped manually")
      } catch (error) {
        console.error("Error stopping recording:", error)
      }
    }
  }

  const playAudio = () => {
    if (!audioRef.current || !audioURL) return

    if (isPlaying) {
      // Stop playback
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    } else {
      // Start playback
      audioRef.current.src = audioURL
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch((error) => {
          console.error("Error playing audio:", error)
          toast({
            title: "Playback Error",
            description: "Could not play the audio. Please try again.",
            variant: "destructive",
          })
        })
    }
  }

  // Handle file upload for transcription
  const handleFileUpload = () => {
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Process the selected audio file
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Check if it's an audio file
    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an audio file (MP3, WAV, M4A, etc.).",
        variant: "destructive",
      })
      return
    }

    // Check file size (25MB limit for OpenAI)
    const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File Too Large",
        description: "Audio file must be less than 25MB. Please upload a smaller file.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`Processing uploaded audio file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)

      // Clean up previous URL if it exists
      if (audioURL) {
        URL.revokeObjectURL(audioURL)
      }

      // Create a URL for the audio file for playback
      const audioUrl = URL.createObjectURL(file)
      setAudioURL(audioUrl)

      // Store the blob for export and playback
      audioBlobRef.current = file

      // Start transcription with the uploaded file
      handleFileTranscription(file)

      // Reset the file input for future uploads
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error processing uploaded file:", error)
      toast({
        title: "File Processing Error",
        description: "Failed to process the uploaded audio file. Please try a different file.",
        variant: "destructive",
      })
    }
  }

  // Separate functions for recording and file transcription to avoid conflicts
  const handleRecordingTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true)
    try {
      console.log(`Preparing to transcribe recorded audio: ${audioBlob.size} bytes, type: ${audioBlob.type}`)

      // Create a FormData object to send the audio file
      const formData = new FormData()

      // Add the audio blob as a file
      formData.append("audio", audioBlob, "recording.wav")

      console.log(`Sending recorded audio for transcription`)

      // Call our transcription API with a longer timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      const transcribedText = data.text

      console.log(`Transcription of recording successful: ${transcribedText.length} characters`)

      // Append transcribed text to existing input or replace if empty
      if (input.trim()) {
        setInput((prev) => prev + " " + transcribedText)
      } else {
        setInput(transcribedText)
      }

      toast({
        title: "Transcription Complete",
        description: `Successfully transcribed recording (${transcribedText.length} characters).`,
      })
    } catch (error) {
      console.error("Error transcribing recording:", error)
      toast({
        title: "Recording Transcription Error",
        description:
          error instanceof Error && error.name === "AbortError"
            ? "Transcription timed out. Your recording may be too long."
            : "Failed to transcribe recording. Please try again or type your description.",
        variant: "destructive",
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  // Separate function for handling file transcription
  const handleFileTranscription = async (audioFile: File) => {
    setIsTranscribing(true)
    try {
      console.log(
        `Preparing to transcribe uploaded file: ${audioFile.name}, ${audioFile.size} bytes, type: ${audioFile.type}`,
      )

      // Create a FormData object to send the audio file
      const formData = new FormData()

      // Add the audio file with its original name
      formData.append("audio", audioFile, audioFile.name)

      console.log(`Sending uploaded file for transcription`)

      // Call our transcription API with a longer timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      const transcribedText = data.text

      console.log(`Transcription of uploaded file successful: ${transcribedText.length} characters`)

      // Append transcribed text to existing input or replace if empty
      if (input.trim()) {
        setInput((prev) => prev + " " + transcribedText)
      } else {
        setInput(transcribedText)
      }

      toast({
        title: "Transcription Complete",
        description: `Successfully transcribed uploaded file (${transcribedText.length} characters).`,
      })
    } catch (error) {
      console.error("Error transcribing uploaded file:", error)
      toast({
        title: "File Transcription Error",
        description:
          error instanceof Error && error.name === "AbortError"
            ? "Transcription timed out. Your file may be too long."
            : "Failed to transcribe uploaded file. Please try a different file or type your description.",
        variant: "destructive",
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleExport = async () => {
    if (!input.trim() && !audioBlobRef.current && !output.trim()) {
      toast({
        title: "Nothing to Export",
        description: "Please add an experiment description, record audio, or generate a methods section first.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const exportData: ExportData = {
        experimentDescription: input,
        methodsSection: output || undefined,
        audioBlob: audioBlobRef.current || undefined,
        createdAt: new Date(),
      }

      await exportToZip(exportData)

      toast({
        title: "Export Successful",
        description: "Your research data has been saved to a zip file.",
        variant: "default",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "There was an error creating the zip file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Create audio element on component mount and handle audio events
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio()

      // Add event listeners for audio playback
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false)
      })

      audioRef.current.addEventListener("error", (e) => {
        console.error("Audio playback error:", e)
        setIsPlaying(false)
      })
    }

    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener("ended", () => {
          setIsPlaying(false)
        })
        audioRef.current.removeEventListener("error", (e) => {
          console.error("Audio playback error:", e)
          setIsPlaying(false)
        })
      }

      if (audioURL) {
        URL.revokeObjectURL(audioURL)
      }
    }
  }, [audioURL])

  // Update audio source when URL changes
  useEffect(() => {
    if (audioRef.current && audioURL) {
      audioRef.current.src = audioURL
      audioRef.current.load()
    }
  }, [audioURL])

  // Determine if export is available
  const canExport = input.trim().length > 0 || !!audioBlobRef.current || output.trim().length > 0

  return (
    <AuthCheck>
      <main className="container mx-auto py-8 px-4">
        <Toaster />
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Research Methods Generator</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={isExporting || !canExport}
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Save to Disk
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save experiment description, methods section, and audio recording as a zip file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <p className="text-center mb-8 text-muted-foreground max-w-2xl mx-auto">
          Enter a high-level description of your research experiment and receive a detailed methods section suitable for
          grant applications or publications.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium">Experiment Description</h2>
              <div className="flex items-center gap-2">
                {/* Hidden file input for audio upload */}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />

                {/* Upload audio button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleFileUpload}
                        disabled={isRecording || isTranscribing}
                        className="h-8 px-2"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload audio file for transcription</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Record audio button */}
                {!isRecording ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={startRecording}
                          disabled={isTranscribing}
                          className="h-8 px-2"
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Record audio</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={stopRecording}
                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Stop Recording"
                  >
                    <MicOff className="h-4 w-4" />
                  </Button>
                )}

                {/* Play/Stop audio button */}
                {audioURL && !isRecording && !isTranscribing && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={playAudio}
                          className={`h-8 px-2 ${isPlaying ? "text-red-600 hover:text-red-700 hover:bg-red-50" : ""}`}
                        >
                          {isPlaying ? <StopCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isPlaying ? "Stop audio" : "Play audio"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Transcribing indicator */}
                {isTranscribing && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Transcribing...</span>
                  </div>
                )}

                <span className="text-sm text-muted-foreground ml-2">{input.length} characters</span>
              </div>
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 mb-2 p-1.5 bg-red-50 rounded-md border border-red-200 text-xs">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </div>
                <span className="text-red-600">Recording...</span>
              </div>
            )}

            <Textarea
              placeholder="Enter a high-level description of your research experiment..."
              className="flex-1 min-h-[400px] p-4 resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium">Methods Section</h2>
              <span className="text-sm text-muted-foreground">{output.length} characters</span>
            </div>
            <div className="border rounded-md flex-1 min-h-[400px] p-4 bg-muted/30 overflow-auto whitespace-pre-wrap">
              {output || (
                <span className="text-muted-foreground italic">Your detailed methods section will appear here...</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center mt-6 gap-2">
          <Button onClick={handleSubmit} disabled={isLoading || !input.trim()} className="px-8">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate Methods
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">Powered by GPT-4o-mini</span>
        </div>

        <div className="mt-8 text-sm text-center text-muted-foreground">
          <p>
            Tip: Include information about your research question, hypotheses, variables, and expected outcomes for
            better results. GPT-4o-mini works best with clear, detailed descriptions.
          </p>
        </div>
      </main>
    </AuthCheck>
  )
}

