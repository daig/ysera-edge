import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Increase the timeout for this route
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json()

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Input text is required" }, { status: 400 })
    }

    // Generate text using the AI SDK on the server side
    // The API key is securely accessed from environment variables
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Transform the following high-level description of a research experiment into a detailed methods section suitable for a grant application or publication. Include appropriate subsections like participants, materials, procedure, and analysis plan where relevant:

${input}

The methods section should be comprehensive, technical, and follow academic writing conventions.`,
      system:
        "You are a scientific writing assistant specialized in creating detailed methods sections for research papers and grant applications.",
      temperature: 0.7,
      maxTokens: 2000, // Set a reasonable limit to avoid timeouts
    })

    return NextResponse.json({ text })
  } catch (error) {
    console.error("Error in generate-methods API route:", error)
    return NextResponse.json({ error: "Failed to generate methods section" }, { status: 500 })
  }
}

