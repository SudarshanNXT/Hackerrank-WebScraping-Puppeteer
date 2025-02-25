import express from "express";
import { scrapeAndSaveData, getDataByUserAndContest } from "../controller/hackerrankController.js";

const router = express.Router();


router.post("/scrape", scrapeAndSaveData);
router.get("/data/:username/:contest_slug", getDataByUserAndContest);

export default router;
