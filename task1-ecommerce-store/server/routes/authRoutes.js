const express = require("express");
const router = express.Router();

console.log("Auth Routes Loaded");

const { register, login } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

module.exports = router;