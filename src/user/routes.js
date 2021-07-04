const express = require("express");
const { createUser, deleteUser, userById, updateUser, prepareUpdateUser, userPhoto, findContacts, findFavorites, addFavorite, removeFavorite } = require("./controller");
const { requireSignin, userValidator, userUpdateValidator, runValidation, hasAuthorization } = require('../auth/controller')

const router = express.Router();

router.post("/create", userValidator, runValidation, createUser);
router.get('/photo/:userId', userPhoto);
router.get('/contacts/:userId', requireSignin, hasAuthorization, findContacts);
router.get('/favorites/:userId', requireSignin, hasAuthorization, findFavorites);
router.put("/update/:userId", requireSignin, hasAuthorization, prepareUpdateUser, userUpdateValidator, runValidation, updateUser);
router.put("/favorite/:userId", requireSignin, hasAuthorization, addFavorite);
router.put("/unfavorite/:userId", requireSignin, hasAuthorization, removeFavorite);
router.delete("/delete/:userId", requireSignin, hasAuthorization, deleteUser);

router.param("userId", userById);

module.exports = router;