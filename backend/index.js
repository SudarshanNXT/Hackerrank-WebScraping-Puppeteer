import express from "express";
import DB from "./utils/config/connectionDB.js";
import hackerrank_scraper_routes from "./routes/hackerrank_scraper_routes.js";
import plagiarismRoutes from "./routes/plagiarismRoutes.js";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

DB(); // Connect to the database

// Use the router correctly
app.use("/api", hackerrank_scraper_routes);
app.use("/api", plagiarismRoutes); // ✅ FIXED

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
