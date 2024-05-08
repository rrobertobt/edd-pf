// Define classes for graph nodes and edges
type TransportationMode = 'vehicle' | 'walking';
type OptimizationCriteria = 'gasoline' | 'physicalWear' | 'distance';

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
  isDirected = true;

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

  showBestRoute(startName: string, endName: string): { route: Edge[] | null, totalDistance: number } {
    console.log(`Finding the best route from ${startName} to ${endName}:`);
    const allRoutes = this.findAllRoutes(startName, endName);
    console.log(`Number of available options: ${allRoutes.length}`);

    let bestRoute: Edge[] | null = null;
    let shortestDistance = Infinity;

    // Find the route with the shortest distance
    allRoutes.forEach(route => {
      let routeDistance = 0;
      route.forEach(edge => {
        routeDistance += edge.distance;
      });

      if (routeDistance < shortestDistance) {
        shortestDistance = routeDistance;
        bestRoute = route;
      }
    });

    if (bestRoute) {
      console.log("Best Route:");
      bestRoute.forEach(edge => {
        console.log(`- Move from ${edge.origin.name} to ${edge.destination.name}, Distance: ${edge.distance}`);
      });
    }

    return { route: bestRoute, totalDistance: shortestDistance };
  }

  showWorstRoute(startName: string, endName: string): { route: Edge[] | null, totalDistance: number } {
    console.log(`Finding the worst route from ${startName} to ${endName}:`);
    const allRoutes = this.findAllRoutes(startName, endName);
    console.log(`Number of available options: ${allRoutes.length}`);

    let worstRoute: Edge[] | null = null;
    let longestDistance = -Infinity;

    // Find the route with the longest distance
    allRoutes.forEach(route => {
      let routeDistance = 0;
      route.forEach(edge => {
        routeDistance += edge.distance;
      });

      if (routeDistance > longestDistance) {
        longestDistance = routeDistance;
        worstRoute = route;
      }
    });

    if (worstRoute) {
      console.log("Worst Route:");
      worstRoute.forEach(edge => {
        console.log(`- Move from ${edge.origin.name} to ${edge.destination.name}, Distance: ${edge.distance}`);
      });
    }

    return { route: worstRoute, totalDistance: longestDistance };
  }

  findBestAndWorstRoute(transportMode: TransportationMode,
    startName: string
    , endName: string
    , criteria1: OptimizationCriteria, criteria2?: OptimizationCriteria

  ): { best: Edge[] | null, worst: Edge[] | null, bestMetric: number, worstMetric: number, bestNodeString: string, worstNodeString: string, allPossibleRoutes: Edge[][], bestRouteDot: string, worstRouteDot: string } {
    console.log(`Finding the best and worst route from ${startName} to ${endName}:`);
    let bestRoute: Edge[] | null = null;
    let worstRoute: Edge[] | null = null;
    let bestMetric = Infinity;
    let worstMetric = -Infinity;
    let bestNodeString = '';
    let worstNodeString = '';

    let tempGraph: Graph;

    // Si se camina, crear una copia temporal del grafo y convertirla en no dirigida
    if (transportMode === 'walking') {
      console.log('Caminando');
      // tempGraph = new Graph();
      // tempGraph.nodes = [...this.nodes];
      // tempGraph.edges = [...this.edges];
      // tempGraph.convertToUndirectedGraph();
      tempGraph = this.convertToUndirectedGraph();
    } else {
      tempGraph = this;
    }

    // Obtener todas las rutas disponibles
    const allRoutes = tempGraph.findAllRoutes(startName, endName);

    // Calcular la métrica combinada si se especifican dos criterios
    const calculateCombinedMetric = (edge: Edge) => {
      let metric1 = 0;
      let metric2 = 0;

      switch (criteria1) {
        case 'gasoline':
          metric1 = edge.gasConsumption;
          break;
        case 'physicalWear':
          metric1 = edge.physicalWear;
          break;
        case 'distance':
          metric1 = edge.distance;
          break;
      }

      if (criteria2) {
        switch (criteria2) {
          case 'gasoline':
            metric2 = edge.gasConsumption;
            break;
          case 'physicalWear':
            metric2 = edge.physicalWear;
            break;
          case 'distance':
            metric2 = edge.distance;
            break;
        }
      }

      return metric2 ? transportMode === 'vehicle' ? metric1 + metric2 : metric2 : metric1;
    };

    // Calcular la mejor y peor ruta según el criterio o los criterios seleccionados
    allRoutes.forEach(route => {
      let routeMetric = 0;
      route.forEach(edge => {
        routeMetric += calculateCombinedMetric(edge);
      });

      let nodeString = route.map(edge => edge.origin.name).join(' = ') + ' = ' + route[route.length - 1].destination.name;
      nodeString += ' (con valor de criterio: ' + routeMetric + ')';

      if (routeMetric < bestMetric) {
        bestMetric = routeMetric;
        bestRoute = route;
        bestNodeString = nodeString;
      }

      if (routeMetric > worstMetric) {
        worstMetric = routeMetric;
        worstRoute = route;
        worstNodeString = nodeString;
      }
    });

    const bestRouteDot = tempGraph.generateDotGraph(bestRoute || []);
    const worstRouteDot = tempGraph.generateDotGraph(worstRoute || []);

    return { best: bestRoute, worst: worstRoute, bestMetric, worstMetric, bestNodeString, worstNodeString, allPossibleRoutes: allRoutes, bestRouteDot, worstRouteDot };
  }

  convertToUndirectedGraph(): Graph {
    console.log('Convirtiendo a grafo no dirigido...');
    // Creamos un nuevo grafo no dirigido
    const undirectedGraph = new Graph();

    // Copiamos los nodos del grafo original
    this.nodes.forEach(node => {
      undirectedGraph.addNode(node);
    });

    // Agregamos los bordes del grafo original al nuevo grafo no dirigido
    this.edges.forEach(edge => {
      // Creamos un nuevo borde del nodo de destino al nodo de origen con la misma información
      const reverseEdge = new Edge(edge.destination, edge.origin, edge.vehicleTime, edge.walkingTime, edge.gasConsumption, edge.physicalWear, edge.distance);
      console.log('Agregando borde: ' + edge.origin.name + ' ' + edge.destination.name + 'con distancia: ' + edge.distance)
      // Agregamos ambos bordes al nuevo grafo no dirigido
      undirectedGraph.addEdge(edge);
      undirectedGraph.addEdge(reverseEdge);
    });

    undirectedGraph.isDirected = false;
    return undirectedGraph;
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
  generateDotGraph(
    edgesToHighlight: Edge[] = [],
  ): string {
    let dot = `digraph G {\n
       
        splines=line;\n
        `;

    // Add nodes
    this.nodes.forEach((node) => {
      // also highlight the nodes that are part of the best route
      const isHighlighted = edgesToHighlight.some(edge => edge.origin.name === node.name || edge.destination.name === node.name);
      const color = isHighlighted ? "red" : "gray";

      dot += `  "${node.name}" [label="${node.name}" color="${color}"];\n`;
      // dot += `  "${node.name}" [label="${node.name}"];\n`;
    });

    // Add edges
    if (this.isDirected) {
      this.edges.forEach((edge) => {
        const isHighlighted = edgesToHighlight.includes(edge);
        const color = isHighlighted ? "red" : "gray";
        const fontColor = isHighlighted ? "red" : "blue";
        dot += `  "${edge.origin.name}" -> "${edge.destination.name}" [label=<<B>${edge.distance}</B>>, weight="${edge.distance}" color="${color}" fontcolor="${fontColor}"];\n`;
      });
    } else {
      // For undirected graphs, we need to add each edge only once
      const addedEdges = new Set<string>();
      this.edges.forEach((edge) => {
        const edgeKey = [edge.origin.name, edge.destination.name].sort().join('-');
        if (!addedEdges.has(edgeKey)) {
          const isHighlighted = edgesToHighlight.includes(edge);
          const color = isHighlighted ? "red" : "gray";
          const fontColor = isHighlighted ? "red" : "blue";
          dot += `  "${edge.origin.name}" -> "${edge.destination.name}" [label=<<B>${edge.distance}</B>>, weight="${edge.distance}" color="${color}" fontcolor="${fontColor}" dir="none"];\n`;
          addedEdges.add(edgeKey);
        }
      });
    }

    dot += '}';

    return dot;
  }
}