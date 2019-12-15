// when start or end node is updated, immediately show search result

export function InstantAnimate(nodes, startNode, endNode, previousPath) {
    // start fresh and run algorithm
    nodes.forEach(nodeRow => nodeRow.forEach(node => node.visited = false));
    previousPath.forEach(({node, type}) => node.setPath(false, false));
    currAlgorithm(startNode, endNode);

    nodes.forEach(nodeRow => nodeRow.forEach(node => {
        if (node.visited) {
            node.setVisited(true, false)
        } else {
            node.setVisited(false, false);
        }
    }))

    // draw path
    const newPath = CreatePath(endNode);
    let pathNode = endNode;
    while (pathNode.from) {
        pathNode.setPath(true, false);
        pathNode = pathNode.from;
    }

    return newPath;
}