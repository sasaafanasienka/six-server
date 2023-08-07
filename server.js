const WebSocket = require('ws');
// const Deck = require('./modules/deck');
// const Player = require('./modules/player');
// const getRandomId = require('./utils/getRandomId');
// const getRandomInteger = require('./utils/getRandomInteger');

class Game {
	constructor() {
		this.server = new WebSocket.Server({
			port: 8079,
		});
		this.deck = undefined;
		this.queue = [];
		this.data = {
			players: [],
			onTop: null,
			reverse: false,
		};
		this.config = {
			maxPLayers: 4,
		};
	}

	init() {
		this.server.on('connection', (socket) => {
			socket.send('connected');
		});
	}
}

const game = new Game();
game.init();

