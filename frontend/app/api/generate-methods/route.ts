import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { experimentDescription } = await req.json()

    if (!experimentDescription) {
      return NextResponse.json({ error: "Experiment description is required" }, { status: 400 })
    }

    // Simply copy the experiment description to the methods section
    const methodsSection = experimentDescription
    
    return NextResponse.json({ text: methodsSection })
  } catch (error) {
    console.error("Method generation error:", error)
    return NextResponse.json({ error: "Failed to generate methods" }, { status: 500 })
  }
} 