const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require("crypto");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Enable JSON request parsing
app.use(express.json());

// ✅ Enable CORS for your frontend
//app.use(cors({ origin: "https://muscle-makers-fe.vercel.app" }));
app.use(cors());

// ✅ Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres.ngdiuptnzskfnuiajuwn:Imagineit99!@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
    ssl: {
      rejectUnauthorized: false,
    },
});

// ✅ Test API Route
app.get('/', (req, res) => {
  res.send('Muscle Makers API is running!');
});

// ✅ Fetch Products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ success: false, error: "Database connection error" });
  }
});

// ✅ Fetch Items
app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items');
    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ success: false, error: "Database connection error" });
  }
});

// ✅ Create Order
app.post("/api/orders", async (req, res) => {
  try {
      const { user_id, order_items, total_price, address } = req.body;

      if (!user_id || !order_items || !total_price || !address) {
          return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      const query = `
      INSERT INTO orders (order_id, user_id, order_items, total_price, order_status, address, created_at, updated_at)
      VALUES (nextval('order_id_seq'), $1, $2, $3, 'Pending', $4, NOW(), NOW())
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

// ✅ Get Orders by User ID
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


app.post("/api/waitlist/:phone_number", async (req, res) => {
  try {
      const { phone_number } = req.body;
      const query = `INSERT INTO WAITLIST (ID, PHONE, CREATED_AT) VALUES 
      (nextval('waitlist_id_seq'), $1, NOW())
      RETURNING *;
      `;
      const values = [phone_number];
      
      const result = await pool.query(query, values);
      res.status(201).json({ success: true, order: result.rows[0] });
  } catch (error) {
      console.error("Error while inserting into waitlist:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});



function hashIP(ip) {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

app.post("/api/audit/:page", async(req, resp) => {
  const { page } = req.body;
    try {
      let userIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      let hashed_ip = hashIP(userIP);

      // Store hashed IP in PostgreSQL
      const query = `INSERT INTO audit_logs (id, hashed_ip, page) VALUES (nextval('audit_logs_id_seq'), $1,$2)`;
      const values = [hashed_ip, page];

      const result = await pool.query(query, values);
      resp.status(200).send(`Your hashed IP is stored securely.`);
    } 
    catch (error) {
        console.error("Error storing IP:", error);
        resp.status(500).send("Internal Server Error");
    }
})

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});