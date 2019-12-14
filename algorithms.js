export function BFS(grid, animationQueue) {
    const queue = [];
    queue.push( grid.startNode );
    while(queue.length > 0) {
        const node = queue.shift();
        if (node == grid.endNode) break;
        if (!node.visited) {     
            node.visited = true;
            animationQueue.push( {node, type: "visit"} );
            node.getNeighbors(grid).forEach(neighbor => {
                if (!neighbor.visited && !neighbor.isWall) queue.push(neighbor);
            });
        }
    }
}

export function DFS(grid, animationQueue) {
    const stack = [];
    stack.push( grid.startNode );
    while(stack.length > 0) {
        let node = stack.pop();
        if (node == grid.endNode) break;
        if (!node.visited) {
            node.visited = true;
            animationQueue.push( {node, type: "visit"} );
            node.getNeighbors(grid).forEach(neighbor => {
                if (!neighbor.visited && !neighbor.isWall) stack.push(neighbor);
            });
        }
    }
}
