export function BFS(startNode, endNode) {
    const animationQueue = [];
    const queue = [startNode];
    while(queue.length > 0) {
        const node = queue.shift();
        if (node == endNode) break;
        if (!node.visited) {     
            node.visited = true;
            animationQueue.push( {node, type: "visit"} );
            node.getAllNeighbors().forEach(({neighbor, direction}) => {
                if (!neighbor.visited) {
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
            node.getAllNeighbors().forEach(({neighbor, direction}) => {
                if (!neighbor.visited) {
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
    nodes.forEach(nodeRow => nodeRow.forEach(node => node.weight = Number.POSITIVE_INFINITY));
    startNode.weight = 0;
    const heap = [startNode];
    while(heap.length > 0) {
        heap.sort((a, b) => b.weight - a.weight);
        let node = heap.pop();
        if (node == endNode) break;
        if (!node.visited) {
            node.visited = true;
            animationQueue.push( {node, type: "visit"} );
            node.getAllNeighbors().forEach(({neighbor, direction}) => {
                // first time seeing neighbor, add it to the set
                if (neighbor.weight == Number.POSITIVE_INFINITY) {
                    neighbor.weight = node.weight + neighbor.cost; 
                    neighbor.from = node;
                    neighbor.direction = direction;
                    heap.push(neighbor)
                // otherwise seen it before, update its weight and the node leading to it if the weight is better
                } else if (node.weight + neighbor.cost < neighbor.weight) { 
                    neighbor.from = node;
                    neighbor.direction = direction;
                    neighbor.weight = node.weight + neighbor.cost;
                }
            });
        }
    }
    return animationQueue;
}