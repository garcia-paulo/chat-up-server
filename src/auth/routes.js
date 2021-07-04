const express = require("express");
const { login, signout } = require("./controller");

const router = express.Router();

router.post("/login", login);
router.get("/logout", signout);

module.exports = router;