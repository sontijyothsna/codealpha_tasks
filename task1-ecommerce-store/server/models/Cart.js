const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

// Remove the problematic pre-save middleware
// Instead, add a method to calculate total when needed
cartSchema.methods.calculateTotal = async function() {
  let total = 0;
  for (let item of this.items) {
    const product = await mongoose.model('Product').findById(item.product);
    if (product) {
      total += product.price * item.quantity;
    }
  }
  return total;
};

module.exports = mongoose.model("Cart", cartSchema);