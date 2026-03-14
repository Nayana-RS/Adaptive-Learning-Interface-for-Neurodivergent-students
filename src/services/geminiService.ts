import { GoogleGenAI, Type } from "@google/genai";
import { SimplifiedContent } from "../types";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function simplifyText(text: string): Promise<SimplifiedContent> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Simplify the following academic text for a neurodivergent student (Dyslexia/ADHD). 
    1. Provide a clear summary of the main thesis.
    2. Break the ENTIRE text into short, clear sentences. Do not omit important details, but simplify the language.
    3. Identify 5-10 key technical keywords.
    4. Convert the main points into simplified bullet points.
    
    IMPORTANT: The output "chunks" array should contain the full simplified version of the input text, broken into pieces of 2-3 sentences each.
    
    Text: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          chunks: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "The text broken down into small chunks of 2-3 sentences each."
          },
          keywords: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          bulletPoints: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          }
        },
        required: ["summary", "chunks", "keywords", "bulletPoints"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as SimplifiedContent;
}
