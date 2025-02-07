const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

require('dotenv').config();


app.use(cors({ origin: "https://muscle-makers-fe.vercel.app" }));

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://muscle-makers-fe.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'pgadmin17',
    port: 5432,
  });

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

app.get('/', (req, res) => {
  res.send('Muscle Makers API is running!');
});

app.get('/api/products', async (req, res) => {
  const result = await pool.query('SELECT * FROM products.products');
  res.json(result.rows);
});

//Below method will fetch all the items from the DB.
app.get('/api/items', async(req, res) => {
  const result = await pool.query('SELECT * FROM items');
  res.json(result.rows);
})

app.post("/api/orders", async (req, res) => {
  try {
      const { user_id, order_items, total_price, address } = req.body;

      // Validate input
      if (!user_id || !order_items || !total_price || !address) {
          return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      const query = `
      INSERT INTO orders (order_id, user_id, order_items, total_price, order_status, address)
      VALUES (nextval('user_id_seq'), $1, $2, $3, 'Pending', $4)
      RETURNING *;
      `;

      const values = [user_id, JSON.stringify(order_items), total_price, address];
      const result = await pool.query(query, values);

      res.status(201).json({ success: true, order: result.rows[0] });
  } catch (error) {
      console.error("Error saving order:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// 📌 Get User Orders API
app.get("/api/orders/:user_id", async (req, res) => {
  try {
      const { user_id } = req.params;
      const query = "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC;";
      const result = await pool.query(query, [user_id]);

      res.json({ success: true, orders: result.rows });
  } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
