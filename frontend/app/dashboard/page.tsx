"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowRight, Mic, MicOff, Play, Download } from "lucide-react"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import AuthCheck from "@/components/auth-check"
import { exportToZip, type ExportData } from "@/utils/file-export"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// Stub function for transcription
const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  // Simulate transcription delay
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return "This is a stub transcription of the audio. Replace this with actual transcription later."
}

export default function Dashboard() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!input.trim()) return

    setIsLoading(true)
    try {
      // Call our new API endpoint instead of using client-side generation
      const response = await fetch('/api/generate-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ experimentDescription: input }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate methods: ${response.statusText}`);
      }

      const data = await response.json();
      setOutput(data.text);
    } catch (error) {
      console.error("Error generating methods section:", error)
      setOutput("An error occurred while generating the methods section. Please try again.")
      toast({
        title: "Error",
        description: "Failed to generate methods section. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      audioChunksRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        audioBlobRef.current = audioBlob // Store the blob for export
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioURL(audioUrl)

        // Create audio element for playback
        if (audioRef.current) {
          audioRef.current.src = audioUrl
        }

        // Automatically start transcription
        handleTranscription(audioBlob)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
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
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
  }

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
    }
  }

  const handleTranscription = async (audioBlob: Blob) => {
    setIsTranscribing(true)
    try {
      const text = await transcribeAudio(audioBlob)

      // Append transcribed text to existing input or replace if empty
      if (input.trim()) {
        setInput((prev) => prev + " " + text)
      } else {
        setInput(text)
      }
    } catch (error) {
      console.error("Error transcribing audio:", error)
      toast({
        title: "Transcription Error",
        description: "Failed to transcribe audio. Please try again or type your description.",
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

  // Create audio element on component mount
  useEffect(() => {
    audioRef.current = new Audio()

    return () => {
      // Clean up on unmount
      if (audioURL) {
        URL.revokeObjectURL(audioURL)
      }
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
                {!isRecording ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startRecording}
                    disabled={isTranscribing}
                    className="h-8 px-2"
                    title="Record Audio"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
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

                {audioURL && !isRecording && !isTranscribing && (
                  <Button variant="ghost" size="sm" onClick={playAudio} className="h-8 px-2" title="Play Recording">
                    <Play className="h-4 w-4" />
                  </Button>
                )}

                {isTranscribing && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="sr-only">Transcribing...</span>
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

        <div className="flex justify-center mt-6">
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
        </div>

        <div className="mt-8 text-sm text-center text-muted-foreground">
          <p>
            Tip: Include information about your research question, hypotheses, variables, and expected outcomes for
            better results. You can also record your description using the microphone button.
          </p>
        </div>
      </main>
    </AuthCheck>
  )
}

