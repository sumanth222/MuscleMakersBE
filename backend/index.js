const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'pgadmin17',
    port: 5432,
  });

app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
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
