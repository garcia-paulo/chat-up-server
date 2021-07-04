const User = require("./model");
const _ = require("lodash");
const formidable = require("formidable");
const fs = require("fs");
const Conversation = require("../conversation/model");

exports.userById = async (req, res, next, id) => {
	User.findById(id)
		.exec((err, user) => {
			if (err) {
				return res.status(400).json({ error: "Usuário não encontrado." })
			}
			req.profile = user;
			next();
		})
}

exports.userPhoto = (req, res, next) => {
	if (req.profile.photo.data) {
		res.set("Content-Type", req.profile.photo.contentType);
		return res.send(req.profile.photo.data);
	}
	next();
}

exports.findContacts = (req, res) => {
	let favorites = req.profile.favorites;
	favorites.push(req.profile._id);
	let search = `${req.query.search}.*`;

	User.find({
		$and: [
			{ _id: { $nin: favorites } },
			{
				$or:
					[{ email: { $regex: search, $options: 'i' } },
					{ name: { $regex: search, $options: 'i' } }]
			}
		]
	}, (err, users) => {
		if (err) {
			return res.status(400).json({ error: err });
		}
		res.json(users);
	})
		.select("_id name about email created")
		.sort("name")
}

exports.createUser = async (req, res) => {
	const emailExist = await User.findOne({ email: req.body.email });

	if (emailExist) {
		return res.status(403).json({
			error: "Esse e-mail já está em uso."
		})
	}

	const user = await new User(req.body);
	await user.save();
	res.status(200).json({ message: "Usuário cadastrado." })
}

exports.prepareUpdateUser = async (req, res, next) => {
	let form = new formidable.IncomingForm();
	form.keepExtensions = true;
	form.parse(req, (err, fields, files) => {
		if (err) {
			return res.status(400).json({ error: "Foto não pode ser atualizada." })
		}

		let user = req.profile;
		user = _.extend(user, fields);

		if (files.photo) {
			user.photo.data = fs.readFileSync(files.photo.path);
			user.photo.contentType = files.photo.type;
		}

		req.body = user;

		next();
	})
}

exports.updateUser = (req, res) => {
	user = req.body;
	user.save((err, results) => {
		if (err) {
			return res.status(400).json({ error: err });
		}

		user.hashed_password = undefined;
		user.salt = undefined;
		return res.json(user);
	})
}

exports.deleteUser = async (req, res) => {
	let user = req.profile;

	await Conversation.find({ "members._id": user._id }, (err, conversations) => {
		if (err) {
			return res.status(400).json({ error: err });
		} else if (conversations) {
			conversations.forEach(element => {
				element.remove();
			});
		}
	})

	await user.remove((err, user) => {
		if (err) {
			return res.status(400).json({ error: err });
		}
		res.json({ message: "Usuário deletado com sucesso!" })
	})
}

exports.addFavorite = (req, res) => {
	User.findByIdAndUpdate(req.profile._id, { $push: { favorites: req.body.favId } }, { new: true })
		.exec((err, result) => {
			if (err) {
				res.status(400).json({ error: err })
			}
			res.json({ message: "Usuário adicionado aos favoritos." });
		})
}

exports.removeFavorite = (req, res) => {
	User.findByIdAndUpdate(req.profile._id, { $pull: { favorites: req.body.favId } }, { new: true })
		.exec((err, result) => {
			if (err) {
				res.status(400).json({ error: err })
			}
			res.json({ message: "Usuário removido dos favoritos." });
		})
}

exports.findFavorites = (req, res) => {
	let favorites = req.profile.favorites;
	let search = `${req.query.search}.*`;

	User.find({
		$and: [
			{ _id: { $in: favorites } },
			{
				$or:
					[{ email: { $regex: search, $options: 'i' } },
					{ name: { $regex: search, $options: 'i' } }]
			}
		]
	}, (err, users) => {
		if (err) {
			return res.status(400).json({ error: err });
		}
		res.json(users);
	})
		.select("_id name about email created")
		.sort("name")
}