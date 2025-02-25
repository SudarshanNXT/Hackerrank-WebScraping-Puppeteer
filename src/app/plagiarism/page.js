"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const PlagiarismPage = () => {
  const searchParams = useSearchParams();
  const contestSlug = searchParams.get("contest");

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contestSlug) return;

    const fetchPlagiarismData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/plagiarism/${contestSlug}`);
        if (!response.ok) throw new Error("Failed to fetch plagiarism data");

        const data = await response.json();
        setMatches(data.exactMatches || []);
      } catch (error) {
        console.error("Error fetching plagiarism data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlagiarismData();
  }, [contestSlug]);

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col items-center w-full">
      <h1 className="text-3xl font-bold text-black mb-4">Plagiarism Check</h1>
      <h2 className="text-xl font-semibold text-black">Contest: {contestSlug}</h2>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : matches.length === 0 ? (
        <p className="text-center text-red-500 mt-4">No plagiarism found</p>
      ) : (
        <div className="w-full overflow-x-auto mt-4">
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="border p-4 text-left">Problem</th>
                <th className="border p-4 text-left">User 1</th>
                <th className="border p-4 text-left">User 2</th>
                <th className="border p-4 text-left">Similarity</th>
                <th className="border p-4 text-left">Code</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match, index) => (
                <tr key={index} className="text-black">
                  <td className="border p-4">{match.problemSlug}</td>
                  <td className="border p-4">
                    <p><strong>{match.user1.username}</strong></p>
                    <p>ID: {match.user1.id}</p>
                    <p>Language: {match.user1.language}</p>
                    <p>Result: {match.user1.result}</p>
                    <a href={match.user1.srclink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                      View Submission
                    </a>
                  </td>
                  <td className="border p-4">
                    <p><strong>{match.user2.username}</strong></p>
                    <p>ID: {match.user2.id}</p>
                    <p>Language: {match.user2.language}</p>
                    <p>Result: {match.user2.result}</p>
                    <a href={match.user2.srclink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                      View Submission
                    </a>
                  </td>
                  <td className="border p-4">{match.similarity}</td>
                  <td className="border p-4 w-full">
                    <div className="w-full h-40 overflow-auto border p-2 bg-gray-100 rounded">
                      <pre className="text-xs">{match.user1.sourceCode}</pre>
                    </div>
                    <div className="w-full h-40 overflow-auto border p-2 bg-gray-200 rounded mt-2">
                      <pre className="text-xs">{match.user2.sourceCode}</pre>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlagiarismPage;
