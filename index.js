const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Root route (optional)
app.get('/', (req, res) => {
  res.send('✅ API is running!');
});

// Serve prematch.json
app.get('/prematch', (req, res) => {
  fs.readFile('prematch.json', 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Unable to read prematch.json' });
    res.json(JSON.parse(data));
  });
});

// Serve live.json
app.get('/live', (req, res) => {
  fs.readFile('live.json', 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Unable to read live.json' });
    res.json(JSON.parse(data));
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
