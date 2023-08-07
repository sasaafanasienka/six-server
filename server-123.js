const WebSocket = require('ws');
const Deck = require('./modules/deck');
const Player = require('./modules/player');
const getRandomId = require('./utils/getRandomId');
const getRandomInteger = require('./utils/getRandomInteger');

class Game {
	constructor() {
		this.server = new WebSocket.Server({
			port: 8080,
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
		this.server.on('connection', (socket, query) => {
				console.log(query);
			if (this.data.players.length < this.config.maxPLayers) {
				socket.addEventListener('message', ({ data }) => { this.connectClient(socket, data); }, { once: true });
			} else {
				this.discardClient(socket);
			}
		});
	}

	connectClient(socket, message) {
			console.log('connte')
		const { id, type } = JSON.parse(message);
		if (type === 'id') {
			const newId = id ?? getRandomId();
			if (!id) {
				socket.send(JSON.stringify({ type: 'new-id', id: newId }));
			}
			if (this.data.players.every((player) => player.getId() !== newId)) {
				const player = new Player({ id: newId, socket });
				this.data.players.push(player);
			}
			console.log('added');
			socket.on('message', (receivedMsg) => { this.messageHandler(receivedMsg, newId); });
			socket.on('close', () => { this.closeHandler(newId); });
			this.refreshToAll();
		}
	}

	getGameData = (player) => {
		const playersForSend = this.data.players
			.filter((el) => el.id !== player.id)
			.map((el) => el.getDataForSend());
		const currentUser = this.data.players.find((el) => el.id === player.id);
		const currentUserForSend = currentUser.getDataForSend(true);
		return {
			...this.data,
			deck: this.deck ? this.deck.cards.length : 36,
			players: null,
			opponents: playersForSend,
			user: currentUserForSend,
		};
	};

	// eslint-disable-next-line class-methods-use-this
	discardClient(socket) {
		socket.send({ type: 'message', data: 'The room is full, please try again later.' });
		socket.close();
	}

	closeHandler(clientId) {
		this.data.players.splice(clientId, 1);
		this.data.players.forEach((client) => {
			client.wins = 0;
			client.socket.send(JSON.stringify({
				type: 'connection',
				clients: this.data.players.length,
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
		console.log('messagehandler');
		const messageData = JSON.parse(message);
		switch (messageData.type) {
		case 'action':
			this.actionHandler(messageData, clientId);
			break;
		case 'move':
			console.log('movehandler');
			this.moveHandler(messageData, clientId);
			break;
		case 'take':
			this.takeHandler(clientId);
			break;
		default:
			break;
		}
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

	moveHandler(messageData) {
		this.data.onTop = messageData.card;
		if (messageData.card.value !== 14) {
			this.setActivePlayer('next');
		} else {
			this.setActivePlayer('skip');
		}
		this.data.reverse = messageData.card.value !== 8 ? this.data.reverse : !this.data.reverse;
		this.refreshToAll();
	}

	takeHandler(clientId) {
		this.players[clientId].cards.push(...this.deal(1));
		this.sendState();
	}

	startGame = () => {
		this.deck = new Deck();
		this.data.players.forEach((player) => {
			// eslint-disable-next-line no-param-reassign
			player.cards = this.deck.deal(4);
		});
		this.setActivePlayer('random');
		this.refreshToAll();
	};

	refreshToAll = () => {
		this.data.players.forEach((player) => {
			player.send('refresh', this.getGameData(player));
		});
	};

	getNextIndex(current = this.active, skip = false) {
		if (!skip) {
			if (!this.reverse) {
				return current + 1 === this.data.players.length ? 0 : current + 1;
			}
			return current - 1 < 0 ? this.data.players.length - 1 : current - 1;
		}
		return this.getNextIndex(false, this.getNextIndex());
	}

	setActivePlayer = (type) => {
		const currentActive = this.data.players.findIndex((player) => player.active);
		const random = getRandomInteger(this.data.players.length - 1);
		this.data.players.forEach((player, index) => {
			// eslint-disable-next-line no-param-reassign
			player.active = false;
			switch (type) {
			case 'random':
				if (index === random) {
					// eslint-disable-next-line no-param-reassign
					player.active = true;
				}
				break;
			case 'next':
				if (index === this.getNextIndex(currentActive)) {
					// eslint-disable-next-line no-param-reassign
					player.active = true;
				}
				break;
			case 'skip':
				if (index === this.getNextIndex(currentActive, true)) {
					// eslint-disable-next-line no-param-reassign
					player.active = true;
				}
				break;
			default:
				break;
			}
		});
	};
}

console.log('server.js');

const game = new Game();
game.init();

