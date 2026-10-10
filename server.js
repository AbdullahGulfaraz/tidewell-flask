const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

// Built-in & Third-Party Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Custom Middleware: Request Logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} request to ${req.originalUrl}`);
  if (req.method === "POST") {
    console.log("Payload:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// Predefined product catalog data
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

// In-memory array for orders/configurations
const savedConfigurations = [];

// GET Endpoint: Fetch predefined product data
app.get("/api/product", (req, res) => {
  res.status(200).json({
    success: true,
    data: localProductData
  });
});

// POST Endpoint: Submit custom configuration
app.post("/api/customizations", (req, res) => {
  const config = req.body;

  // Validate incoming configuration
  if (!config || !config.color || !config.variant) {
    return res.status(400).json({
      success: false,
      message: "Invalid configuration data provided."
    });
  }

  const orderRecord = {
    orderId: `CONF-${Date.now()}`,
    timestamp: new Date().toISOString(),
    configuration: config,
    totalPrice: config.price || localProductData.basePrice
  };

  savedConfigurations.push(orderRecord);
  console.log(`Order ${orderRecord.orderId} registered successfully.`);

  res.status(201).json({
    success: true,
    message: "Custom configuration saved to backend successfully!",
    order: orderRecord
  });
});

app.listen(PORT, () => {
  console.log(`Tidewell Flask Server running on http://localhost:${PORT}`);
});