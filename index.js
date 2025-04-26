const express = require("express");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const cors = require("cors");
require("dotenv").config({ path: "./config.env" });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ======= Connect Mongoose =======
mongoose.connect(process.env.ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ Mongoose Connected"))
  .catch(err => console.error("❌ Mongoose connection error:", err));

// ======= Define User Schema =======
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

const User = mongoose.model("User", UserSchema);

// ======= Connect MongoClient (for old password collection) =======
const client = new MongoClient(process.env.ATLAS_URI);
let collection;

async function connectToDB() {
  try {
    await client.connect();
    const db = client.db("assets");
    collection = db.collection("passwords");
    console.log("✅ MongoClient Connected");
  } catch (err) {
    console.error("❌ MongoClient connection failed:", err.message);
  }
}
connectToDB();

// ======= ROUTES =======

// ➡️ GET all password documents (old collection)
app.get("/password", async (req, res) => {
  try {
    const password = await collection.find({}).toArray();
    res.json(password);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch passwords", error: err.message });
  }
});

// ➡️ POST signup (create new user)
app.post("/signup", async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({ email, password });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// ➡️ POST login (check credentials)
app.post("/login", async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

app.post("/password", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const newPasswordDoc = {
      email,
      password,
      createdAt: new Date(), // optional
    };

    const result = await collection.insertOne(newPasswordDoc);

    res.status(201).json({ message: "Password document created", id: result.insertedId });
  } catch (err) {
    console.error("Password insert error:", err);
    res.status(500).json({ message: "Server error during password insert" });
  }
});


// ======= Start server =======
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
