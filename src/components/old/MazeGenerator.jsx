export const generateMaze = (N) => {
    const maze = Array(N).fill(null).map(() => Array(N).fill(1));
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const cells = [{ x: 0, y: 0 }];
    maze[0][0] = 0;

    while (cells.length) {
        const randomIdx = Math.floor(Math.random() * cells.length);
        const current = cells[randomIdx];
        cells.splice(randomIdx, 1);

        const neighbors = [];

        for (let dir of dirs) {
            const x = current.x + dir[0];
            const y = current.y + dir[1];
            if (x >= 0 && x < N && y >= 0 && y < N && maze[x][y] === 1) {
                neighbors.push({ x, y });
            }
        }

        if (neighbors.length === 1) {
            const neighbor = neighbors[0];
            maze[neighbor.x][neighbor.y] = 0;
            cells.push(neighbor);
        }
    }

    return maze;
}