import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}
function isLady(card) {
    return card instanceof Lad;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isLady(card)
        && (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature')
            || Lad.prototype.hasOwnProperty('modifyTakenDamage')
        )) {
        return 'Чем их больше, тем они сильнее';
    }

    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
    }

    getDescriptions() {
        const creatureDesc = getCreatureDescription(this);
        console.log('creatureDesc', creatureDesc);
        const cardDesc = super.getDescriptions();
        return [creatureDesc, ...cardDesc];
    }

}


class Duck extends Creature {
    constructor(name='Мирная утка', maxPower=2, image='sheriff.png') {
        super(name, maxPower, image);
    }

    quacks() {
        console.log('quack')
    }

    swims() {
        console.log('float: both;')
    }
}

class Dog extends Creature {
    constructor(name='Пес-бандит', maxPower=3, image='bandit.png') {
        super(name, maxPower, image);
    }
}
class Trasher extends Dog {
    constructor() {
        super('Громила', 5, 'gromila.webp');
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {
            super.modifyTakenDamage(value - 1, fromCard, gameContext, continuation);
        });
    }

    getDescriptions() {
        return ['если Громилу атакуют, то он получает на 1 меньше урона', super.getDescriptions()];
    }
}
class Gatling extends Creature {
    constructor() {
        super('Гатлинг', 6, 'gatling.webp');
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        taskQueue.push(onDone => this.view.showAttack(onDone));

        taskQueue.push(onDone => {
            const oppositeCards = oppositePlayer.table.filter(card => card !== undefined);

            if (oppositeCards.length > 0) {
                let completed = 0;

                oppositeCards.forEach(card => {
                    this.dealDamageToCreature(this.currentPower, card, gameContext, () => {
                        completed++;
                        if (completed === oppositeCards.length) {
                            onDone();
                        }
                    });
                });
            } else {
                this.dealDamageToPlayer(1, gameContext, onDone);
            }
        });

        taskQueue.continueWith(continuation);
    }
}

class Lad extends Dog {
    constructor() {
        super('Браток', 2, 'bratok.png');
    }
    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        Lad.setInGameCount(Lad.getInGameCount() + 1)
        return continuation();
    }
    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1)
        return continuation();
    }

    static getBonus() {
        const count = this.getInGameCount();
        return count * (count + 1) / 2;
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

}

class PseudoDuck extends Dog {
    constructor() {
        super('Псевдоутка', 3, 'PseudoDuck.jpg');
    }
    quacks() {
        console.log('quack (fake)');
    }

    swims() {
        console.log('float: both; (fake)');
    }
}

// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck(),
];
const banditStartDeck = [
    new Dog(),
    new PseudoDuck(),
    new Dog(),
];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
