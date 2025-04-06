import express from "express";
import { chatBoxGemini, suggestionMovieGemini } from "../controller/Gemini.js";
const router = express.Router();

router.post("/generate", chatBoxGemini);
router.post("/suggestion", suggestionMovieGemini);

export default router;
