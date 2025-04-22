// index.js
const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Serve the live and prematch data
app.get('/live', (req, res) => {
  fs.readFile('live.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading live data');
    }
    res.json(JSON.parse(data));
  });
});

app.get('/prematch', (req, res) => {
  fs.readFile('prematch.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading prematch data');
    }
    res.json(JSON.parse(data));
  });
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
