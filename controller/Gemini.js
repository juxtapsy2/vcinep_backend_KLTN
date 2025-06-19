import { GoogleGenerativeAI } from "@google/generative-ai";

import {
  getMoviesWithReasons,
  getActiveMovies,
  cleanRequest,
  createMovieSuggestionPrompt,
} from "../utils/suggestionMovieGemini.js"; // Đường dẫn đến hàm tạo prompt của bạn

import { reviewSensePrompt, getCommentByMovieSlug } from "../utils/reviewSenseGemini.js";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const chatBoxGemini = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    const result = await model.generateContent(prompt);

    const request = cleanRequest(result.response.text());

    res.status(200).json({ response: request });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ message: "Error generating content" });
  }
};

export const suggestionMovieGemini = async (req, res) => {
  const { promptUser } = req.body;
  if (!promptUser) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    const movies = await getActiveMovies();

    const prompt = createMovieSuggestionPrompt(movies, promptUser);

    console.log("Prompt:", prompt);

    const result = await model.generateContent(prompt);

    const request = cleanRequest(result.response.text());
    const requestMovies = await getMoviesWithReasons(request);
    res.status(200).json({ response: requestMovies });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ message: "Error generating content" });
  }
};

// export const reviewSenseGemini = async (req, res) => {
//   const { slug } = req.body;
//   if (!slug) {
//     return res.status(400).json({ message: "Prompt is required" });
//   }

//   try {
//     const comment = await getCommentByMovieSlug(slug);

//     const prompt = reviewSensePrompt(comment);

//     console.log("Prompt:", prompt);

//     const result = await model.generateContent(prompt);

//     // const request = cleanRequest(result.response.text());
//     // const requestMovies = await getMoviesWithReasons(request);
//     console.log(prompt)
//     res.status(200).json({ response: result.response.text()});
//   } catch (error) {
//     console.error("Error generating content:", error);
//     res.status(500).json({ message: "Error generating content" });
//   }
// };
export const reviewSenseGemini = async (req, res) => {
  const { slug } = req.body;
  if (!slug) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    const comment = await getCommentByMovieSlug(slug);

    if (!comment || (Array.isArray(comment) && comment.length === 0)) {
      return res.status(200).json({ response: "Không có bình luận để đánh giá" });
    }

    const prompt = reviewSensePrompt(comment);

    console.log("Prompt:", prompt);

    const result = await model.generateContent(prompt);

    res.status(200).json({ response: result.response.text() });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ message: "Error generating content" });
  }
};
