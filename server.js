require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Custom Logging Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} request to ${req.originalUrl}`);
  next();
});

// MySQL Connection Pool using Environment Variables
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tidewell_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test MySQL connection on server start
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
  } else {
    console.log(`✅ Successfully connected to MySQL database: ${process.env.DB_NAME || "tidewell_db"}`);
    connection.release();
  }
});

// Static Product Catalog Info
const localProductData = {
  id: "TW-FLASK-01",
  name: "Tidewell Insulated Flask",
  category: "Drinkware / Outdoor Gear",
  basePrice: 29.0,
  stockStatus: "In Stock",
  description: "Lab-grade double-walled stainless steel flask with custom laser engraving.",
  availableSizes: ["500 ml", "750 ml", "1 L"],
  availableFinishes: ["matte", "glossy"]
};

// GET: Fetch product catalog
app.get("/api/product", (req, res) => {
  res.status(200).json({
    success: true,
    data: localProductData
  });
});

// POST: Save bottle configuration into MySQL
app.post("/api/customizations", (req, res) => {
  const config = req.body;

  if (!config || !config.color || !config.variant) {
    return res.status(400).json({
      success: false,
      message: "Invalid configuration data provided."
    });
  }

  const orderId = `CONF-${Date.now()}`;
  const sql = `
    INSERT INTO bottle_configurations 
    (order_id, product_name, color, cap, size_variant, finish, engraving, font, foil, shimmer, price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    orderId,
    config.productName || "Tidewell Flask",
    config.color,
    config.cap || "graphite",
    config.size || config.variant,
    config.finish || "matte",
    config.engraving || "None",
    config.font || "sans",
    config.foil ? 1 : 0,
    config.shimmer ? 1 : 0,
    config.price || localProductData.basePrice
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Database Insert Error:", err);
      return res.status(500).json({
        success: false,
        message: "Database insertion failed."
      });
    }

    console.log(`[DB] Saved Order ${orderId} (DB ID: ${result.insertId})`);

    res.status(201).json({
      success: true,
      message: "Custom configuration saved to MySQL successfully!",
      order: {
        dbId: result.insertId,
        orderId: orderId,
        configuration: config
      }
    });
  });
});

// GET: View all submitted orders from database
app.get("/api/orders", (req, res) => {
  db.query("SELECT * FROM bottle_configurations ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.status(200).json({ success: true, count: rows.length, data: rows });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});