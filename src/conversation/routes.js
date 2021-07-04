const express = require("express");
const { findOrCreateConversation, getConversations, chatById, disableConversation, addMessage, getMessages } = require('./controller');
const { userById } = require("../user/controller");
const { requireSignin, hasAuthorization } = require("../auth/controller")

const router = express.Router();

router.get("/all/:userId", requireSignin, hasAuthorization, getConversations)
router.get("/messages/:chatId", requireSignin, getMessages)
router.put("/disable/:chatId", requireSignin, disableConversation)
router.post("/with", requireSignin, findOrCreateConversation);
router.post("/add", requireSignin, addMessage);

router.param("userId", userById);
router.param("chatId", chatById);

module.exports = router;