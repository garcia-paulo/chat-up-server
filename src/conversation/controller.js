const Conversation = require('./model');
const User = require('../user/model');
const { conversationAuthorization } = require('../auth/controller');

exports.chatById = async (req, res, next, id) => {
	Conversation.findById(id)
		.exec((err, conversation) => {
			if (err) {
				return res.status(400).json({ error: "Conversa não encontrada." })
			}
			req.chat = conversation;
			next();
		})
}

exports.findOrCreateConversation = async (req, res) => {
	const members = req.body.users;
	const userId = req.auth._id;


	Conversation.findOne({ "members._id": { $all: members } },
		async (err, conversation) => {
			if (err) {
				return res.status(400).json({ error: err });
			} else if (!conversation) {
				const newConversation = await new Conversation(req.body);
				await newConversation.save();
				return res.json(newConversation._id);
			}

			const authenticate = conversationAuthorization(conversation, userId);
			if (!authenticate) {
				return res.json({ error: "Você não está autorizado." })
			}

			conversation.members.forEach(element => {
				if (element._id.equals(userId)) {
					element.visible = true;
				}
			});
			conversation.save();

			res.json(conversation._id);
		})
}

exports.getConversations = (req, res) => {
	const userId = req.profile._id;

	Conversation.find({ members: { _id: userId, visible: true } },
		async (err, conversations) => {
			if (err) {
				return res.status(400).json({ error: err })
			}

			res.json(conversations);
		}
	)
		.select("members")
		.populate("members._id", "name about")
		.sort({ updated: -1 })
}

exports.disableConversation = (req, res) => {
	const conversation = req.chat;
	const userId = req.auth._id;

	const authenticate = conversationAuthorization(conversation, userId);
	if (!authenticate) {
		return res.json({ error: "Você não está autorizado." })
	}

	conversation.members.forEach(element => {
		if (JSON.stringify(element._id) === `"${userId}"`) {
			element.visible = false;
			conversation.save();
			return res.json({ message: "Essa conversa não está mais visível." });
		}
	});
}

exports.addMessage = (req, res) => {
	const { chatId, sender, text } = req.body;

	if (sender !== req.auth._id) {
		return res.json({ error: "Você não está autorizado." })
	}

	Conversation.findByIdAndUpdate(chatId, { $push: { messages: { text, sender } } }, { new: true })
		.exec((err, result) => {
			if (err) {
				res.status(400).json({ error: err })
			}
			result.updated = Date.now();
			result.save();
			res.json(result.messages);
		})
}

exports.getMessages = (req, res) => {
	const conversation = req.chat;
	const userId = req.auth._id;

	const authenticate = conversationAuthorization(conversation, userId);

	if (!authenticate) {
		return res.json({ error: "Você não está autorizado." })
	}
	return res.json(conversation.messages);
}