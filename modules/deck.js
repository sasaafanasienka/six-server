const deck = require('../constants/constants');

class Deck {
	constructor() {
		this.startDeck = deck;
		this.cards = undefined;
		this.garbage = [];
		this.init();
	}

	init() {
		this.cards = this.shuffle(this.startDeck);
	}

	// eslint-disable-next-line class-methods-use-this, no-unused-vars
	shuffle(cards) { return cards.sort((_a, _b) => Math.random() - 0.5); }

	deal(number) {
		const res = [];
		for (let i = 0; i < number; i += 1) {
			res.push(this.cards.pop());
		}
		return res;
	}

	restore() {
		this.cards = this.shuffle(this.garbage);
		this.garbage = [];
	}
}

module.exports = Deck;
