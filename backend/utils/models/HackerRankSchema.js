
import mongoose from "mongoose";


const hackerRankDetailsSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  contest_slug: { type: String, required: true }
}, { timestamps: true });


const submissionSchema = new mongoose.Schema({
  username: { type: String , required:true}, // HackerRank username
  id: { type: String, unique: true }, // Unique submission ID
  language: { type: String, required: true },
  time: { type: Number, required: true, default: 0 },
  result: { type: String, required: true },
  score: { type: Number, required: true, default: 0 },
  duringContest: { type: String , required: true }, 
  srclink: { type: String, required: true},
  sourceCode: { type: String }
}, { timestamps: true });

// Problem Schema
const problemSchema = new mongoose.Schema({
  contest_details: { type: mongoose.Schema.Types.ObjectId, ref: "HackerRankDetails" },
  problemSlug: { type: String, required: true },
  submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Submission" }] // Array of submissions
}, { timestamps: true });

// Create and export models
export const HackerRankDetails = mongoose.model("HackerRankDetails", hackerRankDetailsSchema);
export const Submission = mongoose.model("Submission", submissionSchema);
export const Problem = mongoose.model("Problem", problemSchema);