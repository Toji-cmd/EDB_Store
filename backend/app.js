const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://dbms-class-project-default-rtdb.firebaseio.com",
});

const db = admin.database();

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

// Get endpoint for the home path
app.get("/", (req, res) => {
  res.send("Welcome to the DBMS Project API");
});

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"; // Keep it secure

// Signup Endpoint
app.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const ref = db.ref("users");
    const snapshot = await ref
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    if (snapshot.exists()) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserRef = ref.push();
    await newUserRef.set({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Endpoint
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const ref = db.ref("users");
    const snapshot = await ref
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    if (!snapshot.exists()) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userData = Object.values(snapshot.val())[0];
    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ email: userData.email }, SECRET_KEY, {
      expiresIn: "30d",
    });
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint to add a new product
app.post("/products", async (req, res) => {
  try {
    const product = req.body;
    const ref = db.ref("products");
    const newProductRef = ref.push();
    await newProductRef.set(product);
    res
      .status(201)
      .json({ message: "Product added successfully", id: newProductRef.key });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET endpoint to filter products with pagination
app.get("/products", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 80;
    const page = parseInt(req.query.page) || 1;
    const startAt = (page - 1) * limit;

    // Get filter criteria from query parameters
    const name = req.query.name ? req.query.name.toLowerCase() : null;
    const brand = req.query.brand ? req.query.brand.toLowerCase() : null;
    const minRating = req.query.minRating
      ? parseFloat(req.query.minRating)
      : null;
    const maxRating = req.query.maxRating
      ? parseFloat(req.query.maxRating)
      : null;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const category = req.query.category
      ? req.query.category.toLowerCase()
      : null;

    const ref = db.ref("products");

    // Fetch all products from Firebase
    ref.once("value", (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filter products based on query parameters
        const filteredProducts = Object.values(data).filter((product) => {
          let isValid = true;

          if (name && !product.name.toLowerCase().includes(name)) {
            isValid = false;
          }
          if (brand && !product.product_brand.toLowerCase().includes(brand)) {
            isValid = false;
          }
          if (minRating && product.product_rating < minRating) {
            isValid = false;
          }
          if (maxRating && product.product_rating > maxRating) {
            isValid = false;
          }
          if (minPrice && product.product_price < minPrice) {
            isValid = false;
          }
          if (maxPrice && product.product_price > maxPrice) {
            isValid = false;
          }
          if (
            category &&
            !product.product_category.toLowerCase().includes(category)
          ) {
            isValid = false;
          }

          return isValid;
        });

        // Apply pagination after filtering
        const paginatedProducts = filteredProducts.slice(
          startAt,
          startAt + limit
        );

        if (paginatedProducts.length > 0) {
          res.status(200).json(paginatedProducts);
        } else {
          res
            .status(404)
            .json({ message: "No products found matching the criteria" });
        }
      } else {
        res.status(404).json({ message: "No products found" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET endpoint for retrieving a single product by ID
app.get("/products/:product_id", async (req, res) => {
  try {
    const productId = parseInt(req.params.product_id, 10);
    const ref = db.ref("products");

    ref
      .orderByChild("product_id")
      .equalTo(productId)
      .once("value", (snapshot) => {
        const products = snapshot.val();
        if (products) {
          const productKey = Object.keys(products)[0];
          const product = products[productKey];
          res.status(200).json(product);
        } else {
          res.status(404).json({ message: "Product not found" });
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT endpoint for updating a product by ID
app.put("/products/:product_id", async (req, res) => {
  try {
    const productId = parseInt(req.params.product_id, 10);
    const updates = req.body;
    const ref = db.ref("products");

    ref
      .orderByChild("product_id")
      .equalTo(productId)
      .once("value", async (snapshot) => {
        const products = snapshot.val();
        if (!products) {
          return res.status(404).json({ message: "Product not found" });
        }

        const productKey = Object.keys(products)[0];
        const productRef = db.ref(`products/${productKey}`);
        await productRef.update(updates);
        res.status(200).json({ message: "Product updated successfully" });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE endpoint for removing a product by ID
app.delete("/products/:product_id", async (req, res) => {
  try {
    const productId = parseInt(req.params.product_id, 10);
    const ref = db.ref("products");

    ref
      .orderByChild("product_id")
      .equalTo(productId)
      .once("value", async (snapshot) => {
        const products = snapshot.val();
        if (!products) {
          return res.status(404).json({ message: "Product not found" });
        }

        const productKey = Object.keys(products)[0];
        const productRef = db.ref(`products/${productKey}`);
        await productRef.remove();
        res.status(200).json({ message: "Product deleted successfully" });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seach product
app.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    const ref = db.ref("products");

    ref.once("value", (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filteredProducts = Object.values(data).filter((product) => {
          return (
            product.product_name.toLowerCase().includes(query.toLowerCase()) ||
            product.product_brand.toLowerCase().includes(query.toLowerCase())
          );
        });

        res.status(200).json(filteredProducts);
      } else {
        res.status(404).json({ message: "No products found" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk insert products
const CHUNK_SIZE = 500;
app.post("/products/bulk", async (req, res) => {
  try {
    const products = req.body;
    const ref = db.ref("products");

    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);

      const updates = {};
      chunk.forEach((product) => {
        const newProductRef = ref.push();
        updates[`/${newProductRef.key}`] = product;
      });

      await ref.update(updates);
    }

    res.status(201).json({ message: "Multiple products added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
const verifyToken = (req, res, next) => {
  const token = req.query.token; // Get token from URL

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token expired or invalid" });
    }
    req.user = decoded;
    next();
  });
};

app.get("/user", verifyToken, async (req, res) => {
  try {
    const email = req.user.email; // Extract email from decoded token
    const ref = db.ref("users");
    const snapshot = await ref
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract user data and exclude password
    const userData = Object.values(snapshot.val())[0];
    const user = {
      name: userData.name,
      email: userData.email,
      address: userData.address,
      phone: userData.phone,
      history: userData.history,
    };

    res.status(200).json({ message: "User authenticated", user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/user/update", verifyToken, async (req, res) => {
  try {
    const email = req.user.email; // Extract email from decoded token
    let { history, address, phone } = req.query; // Get fields from query params

    if (!history && !address && !phone) {
      return res
        .status(400)
        .json({
          message:
            "At least one field (history, address, phone) is required to update.",
        });
    }

    const ref = db.ref("users");
    const snapshot = await ref
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    if (!snapshot.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user key in Firebase
    const userKey = Object.keys(snapshot.val())[0];
    const userRef = db.ref(`users/${userKey}`);
    const userData = snapshot.val()[userKey];

    // Prepare update object
    const updates = {};

    if (history) {
      let existingHistory = userData.history || []; // Get existing history array
      let newHistoryItems = history.split(",").map((id) => id.trim()); // Convert query param to array
      let updatedHistory = [
        ...new Set([...existingHistory, ...newHistoryItems]),
      ]; // Merge & remove duplicates
      updates.history = updatedHistory;
    }

    if (address) updates.address = address;
    if (phone) updates.phone = phone;

    // Update user data in Firebase
    await userRef.update(updates);

    res
      .status(200)
      .json({
        message: "User information updated successfully",
        updatedData: updates,
      });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/product/comment/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    const snapshot = await db
      .ref(`/products/${productId}/comments`)
      .once("value");
    const comments = snapshot.val() || [];
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments", error });
  }
});

app.post("/product/comment/:id", async (req, res) => {
  const productId = req.params.id;
  const { userName, comment, rating } = req.body;

  if (!userName || !comment || !rating) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const newComment = {
    userName,
    comment,
    rating,
    timestamp: Date.now(),
  };

  try {
    const commentRef = db.ref(`/products/${productId}/comments`).push();
    await commentRef.set(newComment);
    res
      .status(201)
      .json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    res.status(500).json({ message: "Error adding comment", error });
  }
});

const PORT = process.env.PORT || 3300;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
