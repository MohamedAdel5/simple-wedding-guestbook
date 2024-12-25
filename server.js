const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path'); // To serve static files

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// Database setup
const db = new sqlite3.Database('./db_data/wishes.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    db.run(
      `CREATE TABLE IF NOT EXISTS wishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        message TEXT NOT NULL
      )`,
      (err) => {
        if (err) console.error('Error creating table:', err.message);
      }
    );
  }
});

// API endpoint to submit a wish
app.post('/submit-wish', (req, res) => {
  const { name, wish } = req.body;
  if (!name || !wish) {
    return res.status(400).json({ error: 'Name and wish are required' });
  }

  const stmt = db.prepare('INSERT INTO wishes (name, message) VALUES (?, ?)');
  stmt.run(name, wish, (err) => {
    if (err) {
      console.error('Error saving wish:', err.message);
      res.status(500).json({ error: 'Failed to save wish' });
    } else {
      res.json({ message: 'Wish saved successfully' });
    }
  });
  stmt.finalize();
});

// New API endpoint to get all wishes
app.get('/get-wishes', (req, res) => {
  db.all('SELECT name, message FROM wishes', (err, rows) => {
    if (err) {
        res.status(500).json({ message: 'Error fetching wishes' });
        return;
    }
    res.json(rows); // Ensure it's an array of wishes
  });
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
