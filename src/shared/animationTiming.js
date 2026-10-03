export const slowAnimation = milliseconds => Math.round(milliseconds * 1.2);
export const DICE_ROLL_DURATION = slowAnimation(1400);
export const REPEAT_ROLL_DURATION = slowAnimation(1100);
export const DICE_BOUNCE_PROGRESS = [0.34, 0.62, 0.82, 1];
export const DICE_STAGGER = 0.045;

export const getDiceRollDuration = (roll, reducedMotion = false) => reducedMotion ? 180
    : roll?.duration ?? (roll?.sequence > 3 ? REPEAT_ROLL_DURATION : DICE_ROLL_DURATION);
