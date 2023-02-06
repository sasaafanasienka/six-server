const WebSocket = require('ws');
const Deck = require('./modules/deck');

class Game extends Deck {
	constructor() {
		super();
		this.server = new WebSocket.Server({
			port: 8080,
		});
		this.players = [];
		this.active = 0;
		this.onTop = null;
		this.reverse = false;
	}

	init() {
		console.log('method init');
		super.init();
		this.server.on('connection', (socket) => {
			if (this.players.length < 2) {
				const clientId = this.players.length;
				this.connectClient(socket);
				socket.on('message', (message) => { this.messageHandler(message, clientId); });
				socket.on('close', () => { this.closeHandler(clientId); });
			} else {
				this.discardClient(socket);
			}
		});
	}

	connectClient(socket) {
		console.log('Client connected');

		const clientId = this.players.length;
		this.players.push({
			id: clientId, socket, cards: [],
		});
		this.sendState(clientId);

		this.players.forEach((client) => {
			client.socket.send(JSON.stringify({
				type: 'connection',
				clients: this.players.length,
			}));
		});
	}

	// eslint-disable-next-line class-methods-use-this
	discardClient(socket) {
		socket.send({ type: 'message', data: 'The room is full, please try again later.' });
		socket.close();
	}

	closeHandler(clientId) {
		this.players.splice(clientId, 1);
		this.players.forEach((client) => {
			client.wins = 0;
			client.socket.send(JSON.stringify({
				type: 'connection',
				clients: this.players.length,
			}));
			client.socket.send(JSON.stringify({
				type: 'result',
				data: 'Your opponent is out of the game',
				score: '0-0',
				core: 'draw',
			}));
		});
	}

	messageHandler(message, clientId) {
		// const activeСlient = this.players.find((client) => client.id === clientId);
		const messageData = JSON.parse(message);
		console.log(messageData);
		switch (messageData.type) {
		case 'action':
			this.actionHandler(messageData, clientId);
			break;
		case 'move':
			this.moveHandler(messageData, clientId);
			break;
		case 'take':
			this.takeHandler(clientId);
			break;
		default:
			break;
		}
		console.log(messageData);
	}

	actionHandler(messageData) { // clientId
		switch (messageData.message) {
		case 'start':
			this.startGame();
			break;
		default:
			break;
		}
	}

	moveHandler(messgaeData) {
		this.onTop = messgaeData.card;
		this.active = messgaeData.card.value !== 14 ? this.getNextIndex() : this.getNextIndex(true);
		this.reverse = messgaeData.card.value !== 8 ? this.reverse : !this.reverse;
		this.sendState();
	}

	takeHandler(clientId) {
		this.players[clientId].cards.push(...this.deal(1));
		this.sendState();
	}

	startGame = (clientId) => {
		this.players.forEach((player) => {
			player.cards = this.deal(4);
		});
		this.sendState();
	};

	sendState = () => {
		const playersForSend = this.players.map((el) => ({ ...el, socket: null }));
		this.players.forEach((player) => {
			player.socket.send(JSON.stringify({
				type: 'refresh',
				data: {
					players: playersForSend,
					deck: this.deck.length,
				},
				active: this.active,
				onTop: this.onTop,
				referse: this.reverse,
			}));
		});
	};

	getNextIndex(skip = false, current = this.active) {
		if (!skip) {
			if (!this.reverse) {
				return current + 1 === this.players.length ? 0 : current + 1;
			}
			return current - 1 < 0 ? this.players.length - 1 : current - 1;
		}
		return this.getNextIndex(false, this.getNextIndex());
	}
}

console.log('server.js');

const game = new Game();
game.init();

