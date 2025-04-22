const express = require('express');
const fs = require('fs');
const cors = require('cors'); // ✅ Import cors
const app = express();
const port = process.env.PORT || 10000;

// ✅ Enable CORS for all routes
app.use(cors()); // Or specify origin: { origin: 'https://your-frontend-domain.com' }

app.get('/', (req, res) => {
  res.send('✅ API is running!');
});

app.get('/live', (req, res) => {
  fs.readFile('live.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading live data.');
    }
    res.json(JSON.parse(data));
  });
});

app.get('/prematch', (req, res) => {
  fs.readFile('prematch.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading prematch data.');
    }
    res.json(JSON.parse(data));
  });
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
