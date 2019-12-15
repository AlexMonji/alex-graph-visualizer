export function BFS(startNode, endNode) {
    const animationQueue = [];
    const queue = [startNode];
    while(queue.length > 0) {
        const node = queue.shift();
        if (node == endNode) break;
        if (!node.visited) {     
            node.visited = true;
            animationQueue.push( {node, type: "visit"} );
            node.getNeighbors().forEach(neighbor => {
                if (!neighbor.visited && !neighbor.isWall) queue.push(neighbor);
            });
        }
    }
    return animationQueue;
}

export function DFS(startNode, endNode) {
    const animationQueue = [];
    const stack = [startNode];
    while(stack.length > 0) {
        let node = stack.pop();
        if (node == endNode) break;
        if (!node.visited) {
            node.visited = true;
            animationQueue.push( {node, type: "visit"} );
            node.getNeighbors().forEach(neighbor => {
                if (!neighbor.visited && !neighbor.isWall) stack.push(neighbor);
            });
        }
    }
    return animationQueue;
}
