const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg'); // Import PostgreSQL client
const path = require('path'); // To serve static files

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create a PostgreSQL client and connect to the database
const client = new Client({
  connectionString: process.env.DATABASE_URL, // Use the Render DATABASE_URL environment variable
  ssl: {
    rejectUnauthorized: false, // This is necessary for Render's PostgreSQL instance
  },
});

// Connect to PostgreSQL
client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Error connecting to PostgreSQL', err));

/**
 * POST endpoint to add a new wish
 */
app.post('/submit-wish', async (req, res) => {
  const { name, wish } = req.body;

  if (!name || !wish) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  try {
    // Insert the wish into the database
    const result = await client.query('INSERT INTO wishes (name, message) VALUES ($1, $2) RETURNING id', [name, wish]);
    const newWishId = result.rows[0].id;

    res.status(201).json({ message: 'Wish submitted successfully', id: newWishId });
  } catch (err) {
    console.error('Error saving wish:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET endpoint to retrieve all wishes
 */
app.get('/get-wishes', async (req, res) => {
  try {
    // Retrieve all wishes from the database
    const result = await client.query('SELECT id, name, message FROM wishes ORDER BY id DESC');
    const wishes = result.rows;

    res.status(200).json(wishes);
  } catch (err) {
    console.error('Error retrieving wishes:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Serve the HTML file for the frontend
 */
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// Initialize database tables (if not created already)
async function initializeDatabase() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS wishes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        message TEXT NOT NULL
      );
    `;
    await client.query(createTableQuery);
    console.log('Database table "wishes" is ready');
  } catch (err) {
    console.error('Error creating table:', err);
  }
}

initializeDatabase();

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
