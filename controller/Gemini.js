import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyBAZma1Jz_NIZQtD7UposRjE-b7u6IxjN8");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const chatBoxGemini = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    const result = await model.generateContent(prompt);
    res.status(200).json({ response: result.response.text() });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ message: "Error generating content" });
  }
};
