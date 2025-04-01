import express from "express";
import { chatBoxGemini } from "../controller/Gemini.js";
const router = express.Router();

router.post("/generate", chatBoxGemini);

export default router;
