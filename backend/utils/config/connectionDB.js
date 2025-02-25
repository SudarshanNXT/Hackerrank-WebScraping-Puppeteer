import mongoose from "mongoose";

const DB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/hackerrank')

        console.log("✅ Connected to Database");
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1); // Exit process if DB fails
    }
};

export default DB;
