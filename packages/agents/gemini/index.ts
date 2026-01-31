import { GoogleGenAI } from "@google/genai";

export default async function gemini_node(
  apiKey: string,
  model: string,
  content: string,
  config: object,
) {
  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  const response = await ai.models.generateContent({
    model: model,
    contents: content,
    config: config,
  });

  console.log(response.text);
  return response;
}
