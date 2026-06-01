const Order = require("../models/Order");
const Cart = require("../models/Cart");

exports.createOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity
    }));
    
    // Calculate total correctly
    let totalAmount = 0;
    for (let item of cart.items) {
      totalAmount += item.product.price * item.quantity;
    }
    
    const { shippingAddress, paymentMethod } = req.body;
    
    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address required" });
    }
    
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount: totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || "Cash on Delivery",
      status: "Pending"
    });
    
    // Clear the cart
    cart.items = [];
    await cart.save();
    
    res.status(201).json({
      message: "Order created successfully",
      order
    });
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }
    
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }
    
    if (order.status !== "Pending") {
      return res.status(400).json({ message: "Cannot cancel order that is already processing" });
    }
    
    order.status = "Cancelled";
    await order.save();
    
    res.status(200).json({
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};