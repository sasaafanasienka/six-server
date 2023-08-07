class Player {
	constructor({ id, socket }) {
		this.id = id;
		this.socket = socket;
		this.cards = [];
		this.score = 0;
		this.avatar = 'a';
		this.isActive = false;
	}

	getId = () => this.id;

	getDataForSend = (cards = false) => ({
		id: this.id,
		cards: cards ? this.cards : this.cards.length,
		score: this.score,
		avatar: this.avatar,
		isActive: this.isActive,
	});

	send = (type, data) => {
		console.log(`sending to ${this.id}`);
		this.socket.send(JSON.stringify({ type, data }));
	};

	move = (data) => {
			this.cards = this.cards.filter(card => {return !this.isCardsEqual(data, card)})
	}

	isCardsEqual = (card1, card2) => {
			return (card1.value === card2.value && card1.color === card2.color)
	}
}

module.exports = Player;
