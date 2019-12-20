export function BFS(startNode, endNode) {
    const animationQueue = [];
    const queue = [startNode];
    while(queue.length > 0) {
        const node = queue.shift();
        if (node == endNode) break;
        if (!node.visited) {     
            node.visited = true;
            animationQueue.push( {node, type: "visit"} );
            node.getNeighbors().forEach(({neighbor, direction}) => {
                if (!neighbor.visited && !neighbor.isWall) {
                    neighbor.from = node;
                    neighbor.direction = direction;
                    queue.push(neighbor);
                } 
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
            node.getNeighbors().forEach(({neighbor, direction}) => {
                if (!neighbor.visited && !neighbor.isWall) {
                    neighbor.from = node;
                    neighbor.direction = direction;
                    stack.push(neighbor);
                } 
            });
        }
    }
    return animationQueue;
}

export function Dijkstra(startNode, endNode, nodes) {
    const animationQueue = [];
    nodes.forEach(nodeRow => nodeRow.forEach(node => node.cost = Number.POSITIVE_INFINITY));
    startNode.cost = 0;
    const heap = [startNode];
    while(heap.length > 0) {
        heap.sort((a, b) => b.cost - a.cost);
        let node = heap.pop();
        if (node == endNode) break;
        if (!node.visited) {
            node.visited = true;
            animationQueue.push( {node, type: "visit"} );
            node.getNeighbors().forEach(({neighbor, direction}) => {
                if (!neighbor.isWall) {
                    // first time seeing neighbor, add it to the set
                    if (neighbor.cost == Number.POSITIVE_INFINITY) {
                        neighbor.cost = node.cost + neighbor.weight; 
                        neighbor.from = node;
                        neighbor.direction = direction;
                        heap.push(neighbor)
                    // otherwise seen it before, update its cost and the node leading to it if the cost is better
                    } else if (node.cost + neighbor.weight < neighbor.cost) { 
                        neighbor.from = node;
                        neighbor.direction = direction;
                        neighbor.cost = node.cost + neighbor.weight;
                    }
                }
            });
        }
    }
    return animationQueue;
}

export function AStar(startNode, endNode, nodes) {
    // calculate h-cost for each node
    const animationQueue = [];
    nodes.forEach(nodeRow => nodeRow.forEach((node,index) => {
        node.hCost = node.hCost = Math.abs(endNode.col - node.col) + Math.abs(endNode.row - node.row);
        // Distance is not the below equation because can't move diagonally
        // Math.sqrt((endNode.col - node.col)*(endNode.col - node.col) + (endNode.row - node.row)*(endNode.row - node.row));   
        node.gCost = Number.POSITIVE_INFINITY;
    }))
    startNode.gCost = 0;
    startNode.fCost = 0;
    const heap = [startNode];
    while(heap.length > 0) {
        heap.sort((a, b) => b.fCost - a.fCost);
        let node = heap.pop();
        if (node == endNode) break;
        if (!node.visited) {
            node.visited = true;
            animationQueue.push( {node, type: "visit"} );
            node.getNeighbors().forEach(({neighbor, direction}) => {
                if (!neighbor.isWall) {
                    // first time seeing neighbor, add it to the set
                    if (!neighbor.visited) {
                        if (neighbor.gCost == Number.POSITIVE_INFINITY) {
                            neighbor.gCost = node.gCost + neighbor.weight;
                            neighbor.fCost = neighbor.gCost + neighbor.hCost;
                            neighbor.from = node;
                            neighbor.direction = direction;
                            heap.push(neighbor)
                        // otherwise seen it before, update its cost and the node leading to it if the cost is better
                        } else if (node.gCost + neighbor.weight + neighbor.hCost < neighbor.fCost && !neighbor.visited) {
                            neighbor.from = node;
                            neighbor.direction = direction;
                            neighbor.gCost = node.gCost + neighbor.weight;
                            neighbor.fCost = neighbor.gCost + neighbor.hCost;
                        }
                    }
                }
            });
        }
    }
    return animationQueue;
}
