"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const FetchLatestPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get("username");
  const password = searchParams.get("password");
  const contestSlug = searchParams.get("contest");

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username || !password || !contestSlug) return;

    let didCancel = false;

    const fetchAttempts = async () => {
      try {
        setLoading(true);
        console.log("Fetching data...");

        const response = await fetch("http://localhost:5000/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, contest_slug: contestSlug }),
        });

        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        
        if (!didCancel) {
          // Extract the updated submissions from the response
          const allSubmissions = data.latestData?.updatedSubmissions || [];
          setSubmissions(allSubmissions);
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
  }, [username, password, contestSlug]);

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-black mb-4">User Submissions</h1>

      <button
        className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-md mb-4 hover:bg-green-700"
        onClick={() => router.push(`/plagiarism?contest=${contestSlug}`)}
      >
        Check Plagiarism
      </button>

      <div className="w-full max-w-full bg-white shadow-lg rounded-lg p-4">
        <h2 className="text-xl font-semibold text-black">Contest: {contestSlug}</h2>
        <p className="text-gray-600">Total Submissions: {submissions.length}</p>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-center text-red-500 mt-4">No submissions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-400 mt-4">
              <thead>
                <tr className="bg-green-600 text-black">
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
                {submissions.map((submission, index) => (
                  <tr key={index} className="text-black">
                    <td className="border p-2">{submission.username}</td>
                    <td className="border p-2">{submission.id}</td>
                    <td className="border p-2">{submission.language}</td>
                    <td className="border p-2">{submission.time}</td>
                    <td className="border p-2">{submission.result}</td>
                    <td className="border p-2">{submission.score}</td>
                    <td className="border p-2">{submission.duringContest}</td>
                    <td className="border p-2">
                      <a href={submission.srclink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                        View Code
                      </a>
                    </td>
                    <td className="border p-2">
                      <div className="max-w-xs max-h-40 overflow-auto border p-2 bg-gray-100 rounded">
                        <pre className="text-xs">{submission.sourceCode}</pre>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FetchLatestPage;
