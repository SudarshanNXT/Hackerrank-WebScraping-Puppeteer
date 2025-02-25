import mongoose from "mongoose";
import { Submission, Problem } from "../utils/models/HackerRankSchema.js"; // Adjust path as needed
import difflib from "difflib";
import dotenv from "dotenv";
dotenv.config();

const checkPlagiarism = async (req, res) => {
  const { contest_slug } = req.params;

  try {
    if (!contest_slug) {
      return res.status(400).json({ error: "Contest slug is required" });
    }

    // Fetch only relevant problems that belong to the given contest_slug
    const problems = await Problem.find()
      .populate({
        path: "contest_details",
        match: { contest_slug },
      })
      .populate("submissions");

    const submissions = [];
    problems.forEach(problem => {
      if (problem.contest_details) {
        submissions.push(...problem.submissions.map(sub => ({ ...sub.toObject(), problemSlug: problem.problemSlug })));
      }
    });

    if (submissions.length === 0) {
      return res.status(404).json({ error: "No submissions found for this contest" });
    }

    const exactMatches = [];

    for (let i = 0; i < submissions.length; i++) {
      for (let j = i + 1; j < submissions.length; j++) {
        const sub1 = submissions[i];
        const sub2 = submissions[j];

        if (sub1.language !== sub2.language) continue;

        const similarity = compareCode(sub1.sourceCode, sub2.sourceCode);
        
        console.log(`Comparing ${sub1.username} vs ${sub2.username}: Similarity ${similarity}%`);

        if (similarity >= 90) {
          exactMatches.push({
            problemSlug: sub1.problemSlug,
            user1: formatSubmission(sub1),
            user2: formatSubmission(sub2),
            similarity: similarity.toFixed(2) + "%",
          });
        }
      }
    }

    return res.json({ exactMatches });
  } catch (error) {
    console.error("Error in plagiarism check:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

const compareCode = (code1, code2) => {
  if (!code1 || !code2) return 0;
  
  code1 = normalizeCode(code1);
  code2 = normalizeCode(code2);

  const similarity = new difflib.SequenceMatcher(null, code1, code2).ratio();
  return similarity * 100; // No .toFixed(2) to prevent rounding issues
};

const normalizeCode = (code) => {
  return JSON.stringify(
    code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim()
  ); // Use JSON.stringify to normalize spacing
};

const formatSubmission = (submission) => ({
  username: submission.username,
  id: submission.id,
  language: submission.language,
  time: submission.time,
  result: submission.result,
  duringContest: submission.duringContest,
  srclink: submission.srclink,
  sourceCode: submission.sourceCode,
});

export default checkPlagiarism;