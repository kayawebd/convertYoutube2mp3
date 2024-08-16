// load environment variables from a .env file into process.env
require('dotenv').config();

// Required packages
const express = require("express");
const fetch = require("node-fetch");

// Create an instance of an Express application
const app = express();

// Define the port using the environment variable or default to 3000
const PORT = process.env.PORT || 3000;

//tells Express to use EJS (Embedded JavaScript) as the default template engine for rendering views
app.set("view engine", "ejs");

// tells Express to serve static files (such as images, CSS files, JavaScript files, etc.) from the public directory
app.use(express.static('public'));

// needed for parses URL-encoded payloads
app.use(express.urlencoded({ extended: true }));

//parses JSON payloads in incoming requests and makes the resulting data available in req.body
app.use(express.json());

// GET route
app.get("/", (req, res) => {
  res.render("index");
});

// POST route
app.post("/CONVERT", async (req, res) => {
  const videoId = req.body.videoId;

  if (!videoId) {
    return res.render("index", { success: false, message: "Please enter a valid YouTube video ID" });
  }
  try {
    const fetchAPI = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": process.env.API_KEY,
        "x-rapidapi-host": process.env.API_HOST
      }
    });
    if (fetchAPI.status === 429) {
      // Handling rate limit exceeded by the API
      return res.render("index", {
        success: false, message: 'You have exceeded the DAILY quota for requests on your current plan. Please <a href="https://example.com" target="_blank">UPGRADE your plan</a>.'
      });
    }
    const fetchResponse = await fetchAPI.json();

    if (fetchResponse.status === "ok") {
      const fileSizeMB = (fetchResponse.filesize / 1024 / 1024).toFixed(2);
      // Convert duration from seconds to minutes:seconds format
      const totalSeconds = Math.round(fetchResponse.duration);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      return res.render("index", {
        success: true,
        file_title: fetchResponse.title,
        file_link: fetchResponse.link,
        file_size: fileSizeMB,
        file_duration: formattedDuration
      });
    } else {
      return res.render("index", { success: false, message: fetchResponse.msg });
    }
  } catch (error) {
    console.error("Error fetching data from API:", error);
    return res.render("index", { success: false, message: "An error occurred while processing your request." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
