import { DICE_BOUNCE_PROGRESS, DICE_STAGGER, getDiceRollDuration } from '../shared/animationTiming.js';

export const getDiceSoundEvents = (before, after, { reducedMotion = false, now = Date.now() } = {}) => {
    if (!before || !after.diceRoll || after.rollCount === 0) return [];
    const roll = after.diceRoll;
    if (after.isRolling && roll.id !== before.diceRoll?.id && after.rollCount === before.rollCount + 1) {
        if (reducedMotion) return [{ type: 'dice-impact', delay: 0, strength: 0.65 }];
        const duration = getDiceRollDuration(roll);
        const remaining = roll.startedAt ? Math.max(1, duration - Math.max(0, now - roll.startedAt)) : duration;
        const events = [{ type: 'dice-throw', delay: 0 }];
        const strengths = [1, 0.55, 0.25];
        for (let die = 0; die < 2; die += 1) {
            DICE_BOUNCE_PROGRESS.slice(0, 3).forEach((progress, bounce) => {
                events.push({ type: 'dice-impact', delay: Math.round(remaining * (die * DICE_STAGGER + progress * (1 - die * DICE_STAGGER))), strength: strengths[bounce], contact: bounce === 0 ? 'drop' : 'edge' });
            });
        }
        return events.sort((a, b) => a.delay - b.delay);
    }
    if (before.isRolling && !after.isRolling && before.diceRoll?.id === roll.id && !reducedMotion) {
        return [{ type: 'dice-impact', delay: 0, strength: 0.3, contact: 'edge' },
            { type: 'dice-impact', delay: 35, strength: 0.2, contact: 'edge' }];
    }
    return [];
};
