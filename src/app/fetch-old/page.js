"use client";
import React, { Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const username = searchParams.get("username");
  const contest = searchParams.get("contest");

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username || !contest) return;

    let didCancel = false;

    const fetchAttempts = async () => {
      try {
        setLoading(true);
        const apiUrl = `http://localhost:5000/api/data/${username}/${contest}`;
        const response = await fetch(apiUrl, { method: "GET", headers: { "Content-Type": "application/json" } });

        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        if (!didCancel) {
          // Sort submissions by time (ascending)
          data.problems.forEach(problem => {
            problem.submissions.sort((a, b) => new Date(a.time) - new Date(b.time));
          });

          setSubmissions(data.problems);
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
    return () => {
      didCancel = true;
    };
  }, [username, contest]);

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col items-center w-full">
      <h1 className="text-3xl font-bold text-black mb-4">User Submissions</h1>

      <button
        onClick={() => contest && router.push(`/plagiarism?contest=${contest}`)}
        className={`bg-green-600 text-white px-4 py-2 rounded-lg shadow-md mb-4 ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"}`}
        disabled={loading}
      >
        Check Plagiarism
      </button>

      <div className="w-full max-w-7xl bg-white shadow-lg rounded-lg p-4">
        <h2 className="text-xl font-semibold text-black">Contest: {contest}</h2>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-center text-red-500 mt-4">No submissions found</p>
        ) : (
          <div className="overflow-x-auto w-full">
            {submissions.map((problem, problemIndex) => {
              const uniqueUsers = new Set(problem.submissions.map(sub => sub.username)).size;
              return (
                <Fragment key={problemIndex}>
                  <div className="border-t-4 border-green-600 my-4 py-2 text-xl font-bold text-black text-center bg-gray-100">
                    Problem: {problem.problemSlug} (Users: {uniqueUsers})
                  </div>

                  <table className="w-full border-collapse border border-gray-400">
                    <thead>
                      <tr className="bg-green-600 text-white">
                        <th className="border p-2">Username</th>
                        <th className="border p-2">ID</th>
                        <th className="border p-2">Language</th>
                        <th className="border p-2">Time</th>
                        <th className="border p-2">Result</th>
                        <th className="border p-2">Score</th>
                        <th className="border p-2">During Contest</th>
                        <th className="border p-2">Source Link</th>
                        <th className="border p-2">Source Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {problem.submissions.map((submission, index) => (
                        <tr key={index} className="text-black">
                          <td className="border p-2">{submission.username}</td>
                          <td className="border p-2">{submission.id}</td>
                          <td className="border p-2">{submission.language}</td>
                          <td className="border p-2">{submission.time}</td>
                          <td className="border p-2">{submission.result}</td>
                          <td className="border p-2">{submission.score}</td>
                          <td className="border p-2">{submission.duringContest ? "Yes" : "No"}</td>
                          <td className="border p-2">
                            <a href={submission.srclink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                              View Code
                            </a>
                          </td>
                          <td className="border p-2">
                            <div className="w-96 h-40 overflow-auto border p-2 bg-gray-50 rounded">
                              <pre className="text-xs">{submission.sourceCode}</pre>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
