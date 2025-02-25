// controllers/hackerRankController.js
import mongoose from "mongoose";
import { HackerRankDetails, Problem, Submission } from "../utils/models/HackerRankSchema.js";
import { scrapeHackerRank } from "../scraper/scraper.js";

export const scrapeAndSaveData = async (req, res) => {
  const { username, password, contest_slug } = req.body;

  try {
      // Check if the credentials and contest slug already exist in the database
      const existingDetails = await HackerRankDetails.findOne({ username, password, contest_slug });

      // Track new or updated data
      const latestData = {
          newProblems: [],
          updatedSubmissions: []
      };

      if (existingDetails) {
          // Scrape data from HackerRank
          const { problemSlugs, usernames, submissionsData } = await scrapeHackerRank(username, password, contest_slug);

          // Fetch existing problems and submissions from the database
          const existingProblems = await Problem.find({ contest_details: existingDetails._id }).populate("submissions");

          // Check for new challenges
          const newProblemSlugs = problemSlugs.filter(slug => 
              !existingProblems.some(problem => problem.problemSlug === slug)
          );

          if (newProblemSlugs.length > 0) {
              console.log("New challenges found:", newProblemSlugs);
              // Save new problems and their submissions
              for (const problemSlug of newProblemSlugs) {
                  const problemData = submissionsData.find(data => data.problemSlug === problemSlug);
                  if (problemData) {
                      const problem = new Problem({
                          contest_details: existingDetails._id,
                          problemSlug: problemSlug
                      });

                      const savedProblem = await problem.save();
                      latestData.newProblems.push(savedProblem);

                      for (const submission of problemData.submissions) {
                          const newSubmission = new Submission(submission);
                          await newSubmission.save();
                          savedProblem.submissions.push(newSubmission._id);
                          latestData.updatedSubmissions.push(newSubmission);
                      }

                      await savedProblem.save();
                  }
              }
          }

          // Check for new submissions in existing problems
          for (const existingProblem of existingProblems) {
              const problemData = submissionsData.find(data => data.problemSlug === existingProblem.problemSlug);
              if (problemData) {
                  for (const submission of problemData.submissions) {
                      const existingSubmission = await Submission.findOne({ id: submission.id });
                      if (!existingSubmission) {
                          const newSubmission = new Submission(submission);
                          await newSubmission.save();
                          existingProblem.submissions.push(newSubmission._id);
                          latestData.updatedSubmissions.push(newSubmission);
                      } else if (existingSubmission.time < submission.time && submission.result === "Accepted") {
                          // Update existing submission if the new submission time is greater
                          existingSubmission.language = submission.language;
                          existingSubmission.time = submission.time;
                          existingSubmission.result = submission.result;
                          existingSubmission.score = submission.score;
                          existingSubmission.duringContest = submission.duringContest;
                          existingSubmission.srclink = submission.srclink;
                          existingSubmission.sourceCode = submission.sourceCode;
                          await existingSubmission.save();
                          latestData.updatedSubmissions.push(existingSubmission);
                      }
                  }
                  await existingProblem.save();
              }
          }

          res.status(200).json({ message: "Data updated successfully.", latestData });
      } else {
          // Scrape data from HackerRank
          const { problemSlugs, usernames, submissionsData } = await scrapeHackerRank(username, password, contest_slug);

          // Save HackerRankDetails
          const hackerRankDetails = new HackerRankDetails({ username, password, contest_slug });
          await hackerRankDetails.save();

          // Save Problems and Submissions
          for (const problemData of submissionsData) {
              const problem = new Problem({
                  contest_details: hackerRankDetails._id,
                  problemSlug: problemData.problemSlug
              });

              const savedProblem = await problem.save();
              latestData.newProblems.push(savedProblem);

              for (const submission of problemData.submissions) {
                  const newSubmission = new Submission(submission);
                  await newSubmission.save();
                  savedProblem.submissions.push(newSubmission._id);
                  latestData.updatedSubmissions.push(newSubmission);
              }

              await savedProblem.save();
          }

          res.status(200).json({ message: "Data scraped and saved successfully.", latestData });
      }
  } catch (error) {
      console.error("Error in scrapeAndSaveData:", error);
      res.status(500).json({ message: "Internal server error." });
  }
};

export const getDataByUserAndContest = async (req, res) => {
  const { username, contest_slug } = req.params;

  try {
    const hackerRankDetails = await HackerRankDetails.findOne({ username, contest_slug });

    if (!hackerRankDetails) {
      return res.status(404).json({ message: "No data found for this user and contest." });
    }

    const problems = await Problem.find({ contest_details: hackerRankDetails._id }).populate("submissions");

    res.status(200).json({ problems });
  } catch (error) {
    console.error("Error in getDataByUserAndContest:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};