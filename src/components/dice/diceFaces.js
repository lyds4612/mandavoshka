export const PIP_POSITIONS = {
    1: [[0, 0]],
    2: [[-1, 1], [1, -1]],
    3: [[-1, 1], [0, 0], [1, -1]],
    4: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    5: [[-1, -1], [-1, 1], [0, 0], [1, -1], [1, 1]],
    6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]],
};

// Opposite faces add up to seven, as on a physical six-sided die.
export const DICE_FACES = [
    { value: 1, name: 'front', normal: [0, 0, 1] },
    { value: 6, name: 'back', normal: [0, 0, -1] },
    { value: 2, name: 'top', normal: [0, 1, 0] },
    { value: 5, name: 'bottom', normal: [0, -1, 0] },
    { value: 3, name: 'right', normal: [1, 0, 0] },
    { value: 4, name: 'left', normal: [-1, 0, 0] },
];
