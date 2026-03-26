import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

export async function extractTableData(apiKey: string, base64Data: string, chunkInfo?: string) {
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          },
          {
            text: `Extract the General Ledger data from this document ${chunkInfo || ''}. Focus on the main transaction table. The columns are: Date, Document Number, Narration, Line Remark, Debit Amount, Credit Amount, and Running Total. Ensure every transaction row is captured exactly. If a narration spans multiple lines, merge it into a single cell. Preserve all numeric values and dates. Return the data in the specified JSON format.`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: "You are a high-precision financial data extraction engine. Your task is to convert PDF General Ledgers into structured JSON. You must extract every single transaction row without exception. Do not summarize or omit data. Ensure the output is valid JSON. If you encounter a table that is split across pages, continue extracting it as a continuous set of rows.",
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      maxOutputTokens: 65536,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sheets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                data: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
              },
              required: ["name", "data"],
            },
          },
        },
        required: ["sheets"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from AI");

  try {
    // Clean potential markdown formatting if any (though responseMimeType should prevent it)
    const cleanedJson = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedJson);
  } catch (e) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("The document is too complex for a single pass. We are switching to chunked processing...");
  }
}
