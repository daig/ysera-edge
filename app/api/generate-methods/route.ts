import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import { generateText } from "ai"
import { openai as aiSdkOpenai } from "@ai-sdk/openai"
import { Pinecone } from "@pinecone-database/pinecone"

// Set maxDuration to 60 seconds (maximum allowed for hobby plan)
export const maxDuration = 60

// Define the schema for materials and tools
const MaterialsSchema = z.object({
  ingredients: z.array(z.string()).describe("List of all ingredients needed for the experiment"),
  tools: z.array(z.string()).describe("List of all tools, equipment, and software needed for the experiment"),
})

// Pinecone configuration
const PINECONE_INDEX_NAME = "ysera"
const PINECONE_NAMESPACE = "default"

/**
 * Generates an embedding for the given text using OpenAI's API.
 * @param text - The input text to embed.
 * @param openaiClient - The OpenAI client instance.
 * @returns A promise resolving to the embedding vector (array of numbers).
 */
async function generateEmbedding(text: string, openaiClient: OpenAI): Promise<number[]> {
  try {
    const response = await openaiClient.embeddings.create({
      model: "text-embedding-ada-002", // Using the same model as the working example
      input: text,
    })

    return response.data[0].embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw error
  }
}

/**
 * Queries Pinecone with the given embedding vector to find similar vectors.
 * @param index - The Pinecone index instance.
 * @param queryVector - The embedding vector to query with.
 * @param topK - The number of top results to return.
 * @param namespace - The namespace within the index.
 * @returns A promise resolving to the raw Pinecone query results.
 */
async function queryPinecone(index: any, queryVector: number[], topK = 3, namespace = "default"): Promise<any> {
  try {
    // Get the namespaced index first
    const namespacedIndex = index.namespace(namespace)

    // Then query on the namespaced index without passing namespace again
    const results = await namespacedIndex.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
    })

    return results
  } catch (error) {
    console.error("Error performing similarity search:", error)
    throw error
  }
}

/**
 * Selects the most relevant equipment item from a list of matches based on the methods section.
 * @param matches - Array of equipment matches from Pinecone.
 * @param methodsText - The generated methods section text.
 * @param toolName - The name of the tool/equipment being analyzed.
 * @param openaiClient - The OpenAI client instance.
 * @returns A promise resolving to the selected equipment specification and purpose.
 */
async function selectMostRelevantEquipment(
  matches: Array<{ match: string; score: number }>,
  methodsText: string,
  toolName: string,
  openaiClient: OpenAI,
): Promise<string> {
  try {
    if (!matches || matches.length === 0) {
      return "No relevant equipment specifications found."
    }

    // Format the matches for the prompt
    const matchesText = matches
      .map((match, index) => `Option ${index + 1}: ${match.match} (Similarity: ${(match.score * 100).toFixed(2)}%)`)
      .join("\n\n")

    // Create a prompt for the chat completion
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a laboratory equipment specialist who can identify the most relevant equipment specifications for research methods.",
        },
        {
          role: "user",
          content: `I need to select the most appropriate equipment specification for "${toolName}" based on this research methods section:

---METHODS SECTION---
${methodsText.substring(0, 2000)}... 
---END METHODS SECTION---

Here are three potential equipment specifications from our database:

${matchesText}

Based on the research methods described, which ONE of these equipment specifications is most relevant and appropriate? 
Provide a concise response in this format:
"SELECTED SPECIFICATION: [brief specification of the selected equipment]
PURPOSE: [brief explanation of how this equipment would be used in the described methodology]"

Choose only ONE option and explain why it's the most suitable for this specific research methodology.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    })

    return completion.choices[0].message.content || "Unable to determine the most relevant equipment."
  } catch (error) {
    console.error("Error selecting relevant equipment:", error)
    return "Error processing equipment selection."
  }
}

/**
 * Rewrites the methods section based on selected equipment specifications.
 * @param originalMethodsText - The original generated methods section.
 * @param selectedEquipment - Array of selected equipment with specifications and purposes.
 * @param openaiClient - The OpenAI client instance.
 * @returns A promise resolving to the rewritten methods section.
 */
async function rewriteMethodsWithEquipment(
  originalMethodsText: string,
  selectedEquipment: Array<{ tool: string; selection: string }>,
  openaiClient: OpenAI,
): Promise<string> {
  try {
    if (!selectedEquipment || selectedEquipment.length === 0) {
      return originalMethodsText
    }

    // Format the selected equipment for the prompt
    const equipmentText = selectedEquipment.map((item) => `${item.tool}:\n${item.selection}`).join("\n\n")

    // Create a prompt for the chat completion
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a scientific writing specialist who can rewrite methods sections to incorporate specific equipment details.",
        },
        {
          role: "user",
          content: `I need you to rewrite a research methods section to incorporate specific equipment choices. 

Here is the original methods section:

---ORIGINAL METHODS---
${originalMethodsText}
---END ORIGINAL METHODS---

Here are the specific equipment items that have been selected for this research:

---SELECTED EQUIPMENT---
${equipmentText}
---END SELECTED EQUIPMENT---

Please rewrite the methods section to:
1. Incorporate references to these specific equipment items where appropriate
2. Ensure the steps described make sense for the chosen equipment
3. Maintain the same format, structure, and approximate length as the original
4. Keep the same level of technical detail and academic writing style
5. Make the methods more precise by referencing the specific equipment

The rewritten methods should read as a cohesive, professional methods section suitable for a grant application or publication.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    })

    return completion.choices[0].message.content || originalMethodsText
  } catch (error) {
    console.error("Error rewriting methods section:", error)
    return `Error rewriting methods section. Original methods preserved:\n\n${originalMethodsText}`
  }
}

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json()

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Input text is required" }, { status: 400 })
    }

    console.log("Processing research methods generation for input:", input.substring(0, 100) + "...")

    // Step 1: Generate the detailed methods section using AI SDK
    const { text: methodsText } = await generateText({
      model: aiSdkOpenai("gpt-4o-mini"),
      prompt: `Transform the following high-level description of a research experiment into a detailed methods section suitable for a grant application or publication. Include appropriate subsections like participants, materials, procedure, and analysis plan where relevant:

${input}

The methods section should be comprehensive, technical, and follow academic writing conventions.`,
      system:
        "You are a scientific writing assistant specialized in creating detailed methods sections for research papers and grant applications.",
      temperature: 0.7,
      maxTokens: 1500,
    })

    console.log("Generated initial methods section:", methodsText.substring(0, 100) + "...")

    // Step 2: Generate a structured list of ingredients and tools using OpenAI API directly
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a laboratory manager with expertise in research methodology and equipment. Your task is to identify all necessary materials and tools for conducting experiments.",
        },
        {
          role: "user",
          content: `Based on the following research experiment description, identify all ingredients, tools, equipment, software, and materials that would be needed to complete this experiment:

${input}

For each item, provide a descriptive entry that includes:
1. General specifications or requirements (e.g., "Micropipettes (1-10μL, 10-100μL, and 100-1000μL ranges)" rather than just "Micropipettes")
2. Purpose or function where relevant (e.g., "Centrifuge tubes (15mL, for sample separation)" rather than just "Centrifuge tubes")
3. Quantities or volumes when appropriate (e.g., "Phosphate-buffered saline (PBS), 500mL, for cell washing")
4. Alternative options when applicable (e.g., "Statistical software (SPSS, R, or equivalent) for data analysis")

Keep entries general enough to be widely applicable while remaining faithful to the specific requirements of the experimental design. Focus on standard laboratory items that would be recognized across different research settings.

For ingredients, include all consumable materials, chemicals, reagents, samples, etc.
For tools, include all equipment, instruments, software, hardware, and non-consumable items needed.`,
        },
      ],
      response_format: zodResponseFormat(MaterialsSchema, "materials"),
      temperature: 0.7,
      max_tokens: 1000,
    })

    // Extract the structured data from the response
    const materials = JSON.parse(completion.choices[0].message.content)

    console.log("Generated materials list:", {
      ingredients: materials.ingredients.length,
      tools: materials.tools.length,
    })

    // Log the ingredients and tools to console instead of including in response
    console.log("Ingredients:", materials.ingredients)
    console.log("Tools:", materials.tools)

    // Initialize variables
    let finalMethodsText = methodsText // Default to original methods if no equipment processing is done
    const selectedEquipmentItems: Array<{ tool: string; selection: string }> = []

    if (materials.tools.length > 0) {
      try {
        console.log("Initializing Pinecone client...")
        // Initialize Pinecone client with the correct index and connection string
        const pc = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY || "",
        })

        console.log(`Connecting to Pinecone index: ${PINECONE_INDEX_NAME}, namespace: ${PINECONE_NAMESPACE}`)
        // Get the specific index
        const index = pc.Index(PINECONE_INDEX_NAME)

        // Generate embeddings and search for each tool
        const equipmentMatches = []

        // Limit the number of tools to process to avoid timeout
        const toolsToProcess = materials.tools.slice(0, 3) // Process max 3 tools to stay within time limit
        console.log(`Processing ${toolsToProcess.length} out of ${materials.tools.length} tools`)

        for (const tool of toolsToProcess) {
          try {
            console.log(`Processing tool: "${tool}"`)

            // Generate embedding for the tool
            const embedding = await generateEmbedding(tool, openai)
            console.log(`Generated embedding with ${embedding.length} dimensions`)

            // Search Pinecone for similar texts
            console.log(`Querying Pinecone for similar vectors to "${tool}"...`)
            const searchResponse = await queryPinecone(index, embedding, 3, PINECONE_NAMESPACE)
            console.log(`Found ${searchResponse.matches?.length || 0} matches for "${tool}"`)

            // Collect the matches
            const matches =
              searchResponse.matches?.map((match) => ({
                match: match.metadata?.text || "No text available",
                score: match.score,
              })) || []

            equipmentMatches.push({
              tool,
              matches,
            })
          } catch (error) {
            console.error(`Error processing tool "${tool}":`, error)
            equipmentMatches.push({
              tool,
              matches: [],
              error: "Failed to process this tool",
            })
          }
        }

        // Process each equipment item to select the most relevant
        console.log("Selecting most relevant equipment for each tool...")
        for (const item of equipmentMatches) {
          if (item.matches && item.matches.length > 0) {
            try {
              console.log(`Selecting most relevant specification for "${item.tool}"...`)
              const selectedEquipment = await selectMostRelevantEquipment(item.matches, methodsText, item.tool, openai)

              console.log(`Selected equipment for "${item.tool}": ${selectedEquipment.substring(0, 100)}...`)

              // Store the selected equipment for rewriting the methods
              selectedEquipmentItems.push({
                tool: item.tool,
                selection: selectedEquipment,
              })
            } catch (error) {
              console.error(`Error selecting relevant equipment for "${item.tool}":`, error)
            }
          } else if (item.error) {
            console.log(`Error with tool "${item.tool}": ${item.error}`)
          } else {
            console.log(`No matches found for tool "${item.tool}"`)
          }
        }

        // Rewrite the methods section based on selected equipment
        if (selectedEquipmentItems.length > 0) {
          try {
            console.log("Rewriting methods section with specific equipment...")
            finalMethodsText = await rewriteMethodsWithEquipment(methodsText, selectedEquipmentItems, openai)
            console.log("Successfully rewrote methods section with specific equipment")
          } catch (error) {
            console.error("Error rewriting methods section:", error)
            finalMethodsText = methodsText // Fall back to original methods
          }
        } else {
          console.log("No equipment selected, using original methods section")
        }
      } catch (error) {
        console.error("Error with Pinecone operations:", error)
        finalMethodsText = methodsText // Fall back to original methods
      }
    } else {
      console.log("No tools identified, using original methods section")
    }

    // Only return the final methods section to the user
    return NextResponse.json({ text: finalMethodsText })
  } catch (error) {
    console.error("Error in generate-methods API route:", error)
    return NextResponse.json({ error: "Failed to generate methods section" }, { status: 500 })
  }
}

