interface TreeElement<T> {
  id: number;
  value: T;
}

class TreeNode<T> {
  keys: TreeElement<T>[];
  children: TreeNode<T>[];

  constructor() {
    this.keys = [];
    this.children = [];
  }

  isLeaf(): boolean {
    return this.children.length === 0;
  }
}

export class BTree<T> {
  private root: TreeNode<T>;
  private degree: number;
  private dotGraph: string;
  private idCounter: number;

  constructor(degree: number) {
    this.root = new TreeNode<T>();
    this.degree = degree;
    this.dotGraph = '';
    this.idCounter = 1;
  }

  search(id: number): boolean {
    return this.searchNode(this.root, id);
  }

  private searchNode(node: TreeNode<T>, id: number): boolean {
    for (const key of node.keys) {
      if (key.id === id) {
        return true;
      }
    }

    if (node.isLeaf()) {
      return false;
    } else {
      let i = 0;
      while (i < node.keys.length && id > node.keys[i].id) {
        i++;
      }
      return this.searchNode(node.children[i], id);
    }
  }

  insert(value: T): void {
    const id = this.idCounter++;
    const element: TreeElement<T> = { id, value };

    const root = this.root;
    if (root.keys.length === (2 * this.degree) - 1) {
      const newNode = new TreeNode<T>();
      this.root = newNode;
      newNode.children.push(root);
      this.splitChild(newNode, 0);
      this.insertNonFull(newNode, element);
    } else {
      this.insertNonFull(root, element);
    }
  }

  private splitChild(parent: TreeNode<T>, index: number): void {
    const degree = this.degree;
    const newChild = new TreeNode<T>();
    const oldChild = parent.children[index];
    parent.children.splice(index + 1, 0, newChild);
    parent.keys.splice(index, 0, oldChild.keys[degree - 1]);

    newChild.keys = oldChild.keys.splice(degree, degree - 1);

    if (!oldChild.isLeaf()) {
      newChild.children = oldChild.children.splice(degree, degree);
    }
  }

  private insertNonFull(node: TreeNode<T>, element: TreeElement<T>): void {
    let i = node.keys.length - 1;
    if (node.isLeaf()) {
      while (i >= 0 && element.id < node.keys[i].id) {
        node.keys[i + 1] = node.keys[i];
        i--;
      }
      node.keys[i + 1] = element;
    } else {
      while (i >= 0 && element.id < node.keys[i].id) {
        i--;
      }
      i++;
      if (node.children[i].keys.length === (2 * this.degree) - 1) {
        this.splitChild(node, i);
        if (element.id > node.keys[i].id) {
          i++;
        }
      }
      this.insertNonFull(node.children[i], element);
    }
  }

  private generateDOT(node: TreeNode<T>): void {
    /*
    example:
    digraph ArbolB {
    node [shape=record];

    node0 [label="<f0> |<f1> 4 |<f2>"];
    node1 [label="<f0> |<f1> 1 |<f2>"];
    node2 [label="<f0> |<f1> 3 |<f2>"];
    node3 [label="<f0> |<f1> 6 |<f2>"];
    node4 [label="<f0> |<f1> 8 |<f2>"];
    node5 [label="<f0> |<f1> 10 |<f2>"];
    node6 [label="<f0> |<f1> 5 |<f2>"];
    node7 [label="<f0> |<f1> 7 |<f2>"];
    node8 [label="<f0> |<f1> 9 |<f2>"];
    
    node0:f0 -> node1:f1;
    node0:f2 -> node3:f1;
    node1:f0 -> node2:f1;
    node1:f2 -> node6:f1;
    node3:f0 -> node4:f1;
    node3:f2 -> node5:f1;
    node4:f0 -> node7:f1;
    node4:f2 -> node8:f1;
}
    */

  const queue: TreeNode<T>[] = [];
  let counter = 0;
  const nodeIdMap = new Map<TreeNode<T>, string>();

  const generateNodeId = (node: TreeNode<T>): string => {
    if (!nodeIdMap.has(node)) {
    const nodeId = `node${counter++}`;
    nodeIdMap.set(node, nodeId);
    }
    return nodeIdMap.get(node)!;
  };

  const generateNodeLabel = (node: TreeNode<T>): string => {
    const labels = node.keys.map((key) => key.value).join(' | ');
    return `<f0> |<f1> ${labels} |<f2>`;
  };

  queue.push(this.root);
  while (queue.length > 0) {
    const currentNode = queue.shift()!;
    const nodeId = generateNodeId(currentNode);
    const nodeLabel = generateNodeLabel(currentNode);
    this.dotGraph += `${nodeId} [label="${nodeLabel}"];\n`;

    for (let i = 0; i < currentNode.children.length; i++) {
    const childNode = currentNode.children[i];
    const childNodeId = generateNodeId(childNode);
    this.dotGraph += `${nodeId}:f${i*2} -> ${childNodeId}:f1;\n`;
    queue.push(childNode);
    }
  }

}

  

  generateGraph(): string {
    this.dotGraph = 'digraph BTree {\n';
    this.dotGraph += 'node [shape=record];\n';
    this.generateDOT(this.root);
    this.dotGraph += '}';

    return this.dotGraph;
  }
}