import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { experimentDescription } = await req.json()

    if (!experimentDescription) {
      return NextResponse.json({ error: "Experiment description is required" }, { status: 400 })
    }

    // Call our Python Vercel function
    const response = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || ''}/api/generate-methods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ experimentDescription }),
    })

    if (!response.ok) {
      throw new Error(`Python function error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Method generation error:", error)
    return NextResponse.json({ error: "Failed to generate methods" }, { status: 500 })
  }
} 