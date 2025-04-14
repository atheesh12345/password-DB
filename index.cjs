const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
require("dotenv").config({ path: "./config.env" });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Middleware for parsing JSON

const uri = process.env.ATLAS_URI;
const client = new MongoClient(uri);

let collection;


async function connectToDB() {
  try {
    await client.connect();
    const db = client.db("assets");
    collection = db.collection("songdetails");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
}
connectToDB();

// Route to get all songs
app.get("/songs", async (req, res) => {
  try {
    const songs = await collection.find({}).toArray();
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch songs", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
