import express from "express";
import checkPlagiarism from "../controller/hackerrank_plagiarismCheck.js";

const router = express.Router();
router.get("/plagiarism/:contest_slug", checkPlagiarism);

export default router;
