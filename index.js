const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 10000;

// Serve a basic route for health check
app.get('/', (req, res) => {
  res.send('✅ API is running!');
});

// Route for fetching live data
app.get('/live', (req, res) => {
  fs.readFile('live.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading live data.');
    }
    res.json(JSON.parse(data));
  });
});

// Route for fetching prematch data
app.get('/prematch', (req, res) => {
  fs.readFile('prematch.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading prematch data.');
    }
    res.json(JSON.parse(data));
  });
});

// Start the API server
app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
