const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");

console.log("Cart routes loaded");

// Middleware to get user ID from token
const getUserId = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// GET /api/cart - Get user's cart
router.get("/", getUserId, async (req, res) => {
  try {
    console.log("Getting cart for user:", req.userId);
    
    let cart = await Cart.findOne({ user: req.userId }).populate('items.product');
    
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
      await cart.save();
    }
    
    res.json(cart);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/cart - Add item to cart
router.post("/", getUserId, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    console.log("Adding to cart:", { productId, quantity, userId: req.userId });
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Find or create cart
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }
    
    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    
    await cart.save();
    await cart.populate('items.product');
    
    res.json({ message: "Item added to cart", cart });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/cart/item - Update item quantity
router.put("/item", getUserId, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
    
    await cart.save();
    await cart.populate('items.product');
    
    res.json({ message: "Cart updated", cart });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/cart/item/:productId - Remove single item from cart
router.delete("/item/:productId", getUserId, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
    await cart.save();
    await cart.populate('items.product');
    
    res.json({ message: "Item removed from cart", cart });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/cart - Clear entire cart
router.delete("/", getUserId, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    
    if (!cart) {
      return res.status(200).json({ 
        message: "Cart already empty",
        cart: { items: [] }
      });
    }
    
    cart.items = [];
    await cart.save();
    
    res.status(200).json({
      message: "Cart cleared successfully",
      cart: { items: [] }
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;