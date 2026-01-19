const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files later (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, "..", "public")));

// Test route (health check)
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
