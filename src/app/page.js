"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    contest: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFetchLatest = () => {
    const { username, password, contest } = formData;
    if (!username || !password || !contest) {
      alert("Please fill in all fields!");
      return;
    }
    
    // Navigate to fetch-latest page with query params
    router.push(`/fetch-latest?username=${encodeURIComponent(username)}&password=${(password)}&contest=${encodeURIComponent(contest)}`);
  };
  const handleFetchOld = () => {
    const { username, password, contest } = formData;
    if (!username || !password || !contest) {
      alert("Please fill in all fields!");
      return;
    }
    
    // Navigate to fetch-latest page with query params
    router.push(`/fetch-old?username=${encodeURIComponent(username)}&contest=${encodeURIComponent(contest)}`);
  };
  return (
    <div className="flex flex-col items-center min-h-screen bg-white text-black">
      <h1 className="text-3xl font-bold text-black mt-10">
        <span className="text-green-600">HackerRank</span> Plagiarism Checker
      </h1>
      <form className="mt-6 space-y-6 bg-white p-8 rounded-lg shadow-lg w-96 border border-gray-200">
        <div>
          <label htmlFor="username" className="block text-gray-700 mb-1">Username:</label>
          <input id="username" type="text" className="w-full p-2 border border-gray-300 rounded" value={formData.username} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="password" className="block text-gray-700 mb-1">Password:</label>
          <input id="password" type="password" className="w-full p-2 border border-gray-300 rounded" value={formData.password} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="contest" className="block text-gray-700 mb-1">Contest Name:</label>
          <input id="contest" type="text" className="w-full p-2 border border-gray-300 rounded" value={formData.contest} onChange={handleChange} />
        </div>
        <div className="flex justify-between">
          <button type="button" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"onClick={handleFetchOld

          }>Fetch Old</button>
          <button type="button" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={handleFetchLatest}>Fetch Latest</button>
          <button type="reset" className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800" onClick={() => setFormData({ username: "", password: "", contest: "" })}>Reset</button>
        </div>
      </form>
    </div>
  );
};

export default Page;
