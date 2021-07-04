const mongoose = require("mongoose");
const crypto = require("crypto");
const { v1: uuidv1 } = require("uuid");
const { ObjectId } = mongoose.Schema;

const userSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true
    },
    hashed_password: {
        type: String,
        required: true
    },
    salt: String,
    created: {
        type: Date,
        default: Date.now
    },
    photo: {
        data: Buffer,
        contentType: String
    },
    about: {
        type: String,
        trim: true,
        default: "Olá mundo!"
    },
    favorites: [{ type: ObjectId, ref: "User" }]
})

userSchema.virtual('password')
    .set(function (password) {
        this._password = password;

        this.salt = uuidv1();

        this.hashed_password = this.encryptPassword(password);
    })
    .get(function () {
        return this._password;
    })

userSchema.methods = {
    authenticate: function (text) {
        return this.encryptPassword(text) === this.hashed_password;
    },

    encryptPassword: function (password) {
        if (!password) return "";
        try {
            return crypto
                .createHmac('sha1', this.salt)
                .update(password)
                .digest('hex');
        }
        catch (err) {
            return "";
        }
    }
}

module.exports = mongoose.model("User", userSchema);