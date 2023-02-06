const deck = require('../constants/constants');

class Deck {
	constructor() {
		this.startDeck = deck;
		this.deck = undefined;
		this.garbage = [];
	}

	init() {
		this.deck = this.shuffle(this.startDeck);
	}

	// eslint-disable-next-line class-methods-use-this, no-unused-vars
	shuffle(cards) { return cards.sort((_a, _b) => Math.random() - 0.5); }

	deal(number) {
		const res = [];
		for (let i = 0; i < number; i += 1) {
			res.push(this.deck.pop());
		}
		return res;
	}

	restore() {
		this.deck = this.shuffle(this.garbage);
		this.garbage = [];
	}
}

module.exports = Deck;
