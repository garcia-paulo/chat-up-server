const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
require('dotenv');
const User = require("../user/model");
const { check, validationResult, body, oneOf } = require("express-validator");

exports.login = (req, res) => {
	const { email, password } = req.body;
	User.findOne({ email }, (err, user) => {
		if (err || !user) {
			return res.status(401).json({ error: "Não encontramos um usuário com esse endereço de e-mail." });
		}

		if (!user.authenticate(password)) {
			return res.status(401).json({ error: "Usuário e senha não correspondentes." });
		}

		const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
		res.cookie("tkn", token, { expire: new Date() + 9999 });

		const { _id, name, email, about } = user;
		res.status(200).json({ token, user: { _id, name, email, about } });
	})
}

exports.signout = (req, res) => {
	res.clearCookie("tkn");
	return res.status(200).json({ message: "Signout success!" });
}

exports.requireSignin = expressJwt({
	secret: process.env.JWT_SECRET,
	algorithms: ["HS256"],
	userProperty: "auth"
})

exports.hasAuthorization = (req, res, next) => {
	const authorized = req.profile && req.auth && req.profile._id == req.auth._id;

	if (!authorized) {
		return res.status(403).json({ error: "Você não está autorizado a fazer essa ação." })
	}
	next();
}

exports.conversationAuthorization = (conversation, userId) => {
	let authenticate = false;
	conversation.members.map(member => {
		if (member._id.equals(userId)) {
			authenticate = true;
		}
	})
	return authenticate;
}

exports.runValidation = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ error: errors.array()[0].msg });
	}
	next();
}

exports.userValidator = [
	check('name', 'É necessário fornecer um nome de usuário que contenha entre 5 e 10 caracteres.').isLength({ min: 5, max: 10 }),
	check('email', 'É necessário fornecer um endereço de e-mail válido.').isEmail(),
	check('password', 'É necessário fornecer uma senha com no mínimo 6 caracteres.').isLength({ min: 6 })
]

exports.userUpdateValidator = [
	body('name', 'É necessário fornecer um nome de usuário que contenha entre 5 e 10 caracteres.').isLength({ min: 5, max: 10 }),

	body('about', 'Sua descrição precisa conter menos que 300 caracteres.').isLength({ max: 300 }),
	oneOf([
		body('fileSize').isInt({ lt: 100000 }),
		body('fileSize').isEmpty()
	], 'Essa imagem é muito grande para ser armazenada.'),
	oneOf(
		[body('password').isLength({ min: 6 }),
		body('password').isEmpty()
		], 'É necessário fornecer uma senha com no mínimo 6 caracteres.'
	),
	body('email')
		.isEmail().withMessage('É necessário fornecer um endereço de e-mail válido.')
		.custom((value, { req }) => {
			return User.findOne({ email: value })
				.then(user => {
					if (user && !user._id.equals(req.profile._id)) {
						return Promise.reject('Esse endereço de e-mail já está em uso.')
					}
				})
		})
]