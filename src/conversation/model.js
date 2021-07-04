const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const conversationSchema = mongoose.Schema({
	members: [{
		_id: { type: ObjectId, ref: "User" },
		visible: { type: Boolean, default: true }
	}],
	messages: [{
		text: String,
		sender: {
			type: ObjectId,
			ref: "User"
		},
		created: {
			type: Date,
			default: Date.now
		}
	}],
	updated: {
		type: Date,
		default: Date.now
	}
})

module.exports = mongoose.model("Conversation", conversationSchema);