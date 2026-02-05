import cors from "cors";
import express from "express";
import path from "path";
import apiRoutes from "./routes/api";

const app = express();
const PORT = 4901;

//Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/", apiRoutes); // Mount API routes at root for simplicity to match previous behavior

// Static files for downloads - traverse up from src to backend root to valid uploads folder
// In this setup: backend/src/server.ts -> backend/uploads
app.use("/downloads", express.static(path.resolve(__dirname, "../uploads")));

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `Local uploads directory: ${path.resolve(__dirname, "../uploads")}`,
  );
});
