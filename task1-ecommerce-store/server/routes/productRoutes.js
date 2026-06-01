const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,  // NEW
  deleteProduct   // NEW
} = require("../controllers/productController");

router.post("/", addProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);     // NEW - Update product
router.delete("/:id", deleteProduct);  // NEW - Delete product

module.exports = router;