// Define classes for graph nodes and edges
export class GraphNode {
  constructor(public name: string) { }
}

interface TrafficInterval {
  startTime: number;
  endTime: number;
  trafficProbability: number;
}


export class Edge {
  trafficIntervals: TrafficInterval[] = [];
  constructor(public origin: GraphNode, public destination: GraphNode, public vehicleTime: number, public walkingTime: number, public gasConsumption: number, public physicalWear: number, public distance: number) { }
}

// Class to handle the graph
export class Graph {
  nodes: GraphNode[] = [];
  edges: Edge[] = [];
  adjencyList: Map<string, string[]> = new Map();

  constructor() {
    // this.buildGraph(routeData);
  }

  getNodes(): GraphNode[] {
    return this.nodes;
  }

  isEmpty(): boolean {
    return this.nodes.length === 0;
  }

  addNode(node: GraphNode) {
    // this.nodes.push(node);
    if (!this.nodes.some(existingNode => existingNode.name === node.name)) {
      this.nodes.push(node);
      this.adjencyList.set(node.name, []);
    }
  }

  addEdge(edge: Edge) {
    this.edges.push(edge);
    // if (edge.origin.name === 'Retalhuleu') console.log('adding edge: ' + edge.origin.name + '' +  edge.destination.name)
    this.adjencyList.get(edge.origin.name)?.push(edge.destination.name);
    this.adjencyList.get(edge.destination.name)?.push(edge.origin.name);
  }

  // Function to read the input file and build the graph
  buildGraph(routeData: string[]) {
    routeData.forEach((line) => {
      const [origin, destination, vehicleTime, walkingTime, gasConsumption, physicalWear, distance] = line.split('|');
      const originNode = new GraphNode(origin);
      const destinationNode = new GraphNode(destination);
      const edge = new Edge(originNode, destinationNode, parseInt(vehicleTime), parseInt(walkingTime), parseInt(gasConsumption), parseInt(physicalWear), parseInt(distance));

      this.addNode(originNode);
      this.addNode(destinationNode);
      this.addEdge(edge);
    });
    console.log(this.adjencyList);
  }

  private findAllRoutesDFSUtil(
    startName: string,
    endName: string,
    visited: Map<string, boolean>,
    path: Edge[],
    allRoutes: Edge[][]
  ) {
    visited.set(startName, true);
    const outgoingEdges = this.edges.filter(
      edge => edge.origin.name === startName && !visited.get(edge.destination.name)
    );
    for (const edge of outgoingEdges) {
      const nextNodeName = edge.destination.name;
      path.push(edge);
      if (nextNodeName === endName) {
        allRoutes.push([...path]);
      } else {
        this.findAllRoutesDFSUtil(nextNodeName, endName, visited, path, allRoutes);
      }
      path.pop();
    }
    visited.set(startName, false);
  }

  findAllRoutes(startName: string, endName: string): Edge[][] {
    const start = this.nodes.find(node => node.name === startName);
    const end = this.nodes.find(node => node.name === endName);
    if (!start || !end) {
      return [];
    }

    const visited = new Map<string, boolean>();
    this.nodes.forEach(node => visited.set(node.name, false));

    const allRoutes: Edge[][] = [];
    const path: Edge[] = [];

    this.findAllRoutesDFSUtil(startName, endName, visited, path, allRoutes);
    console.log(allRoutes);
    return allRoutes;
  }

  showAvailableOptions(startName: string, endName: string): Edge[][] {
    console.log(`Available options from ${startName} to ${endName}:`);
    const allRoutes = this.findAllRoutes(startName, endName);
    console.log(`Number of available options: ${allRoutes.length}`);

    // Display options
    allRoutes.forEach((route, index) => {
      console.log(`Option ${index + 1}:`);
      route.forEach(edge => {
        console.log(`- Move from ${edge.origin.name} to ${edge.destination.name}, Distance: ${edge.distance}`);
      });
    });

    return allRoutes;
  }


  updateTrafficData(trafficData: string[]) {
    trafficData.forEach((line) => {
      const [origin, destination, startTime, endTime, trafficProbability] = line.split('|');
      const edge = this.edges.find(edge => edge.origin.name === origin && edge.destination.name === destination);
      if (edge) {
        edge.trafficIntervals.push({
          startTime: parseInt(startTime),
          endTime: parseInt(endTime),
          trafficProbability: parseInt(trafficProbability)
        });
      }
    });
  }


  // Function to generate a Graphviz DOT string from the graph
  generateDotGraph(): string {
    let dot = `digraph G {\n
       
        splines=line;\n
        `;

    // Add nodes
    this.nodes.forEach((node) => {
      dot += `  "${node.name}" [label="${node.name}"];\n`;
    });

    // Add edges
    this.edges.forEach((edge) => {
      dot += `  "${edge.origin.name}" -> "${edge.destination.name}" [label="${edge.distance}", weight=${edge.distance}];\n`;
    });

    dot += '}';

    return dot;
  }
}