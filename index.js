const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");

require("dotenv").config();
const port = process.env.PORT || 3001;

//db
const mongoose = require("./src/configs/database");

//routes
const authRoutes = require("./src/auth/routes");
const userRoutes = require("./src/user/routes");
const conversationRoutes = require("./src/conversation/routes");

//middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/chat", conversationRoutes);

const server = app.listen(port, () => {
	console.log(`API running on port number ${port}`)
})

const io = require('socket.io')(server, { cors: { origin: '*' } });

io.on('connection', socket => {
	const id = socket.handshake.query.id;
	socket.join(id);

	socket.on('send-message', message => {
		socket.broadcast.to(id).emit('receive-message', message);
	})
})