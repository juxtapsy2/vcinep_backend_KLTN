import express from "express";
import { chatBoxGemini, suggestionMovieGemini, reviewSenseGemini } from "../controller/Gemini.js";
const router = express.Router();

router.post("/generate", chatBoxGemini);
router.post("/suggestion", suggestionMovieGemini);
router.post("/reviewsense", reviewSenseGemini);
export default router;
