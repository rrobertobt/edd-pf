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

class BTree<T> {
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

  private generateDOT(node: TreeNode<T>, parentIndex?: number): void {
      const nodeId = node.keys.map(key => key.id).join('_');
      this.dotGraph += `node_${nodeId} [shape=box, width=0.7, label="${node.keys.map(key => key.value).join(', ')}"];\n`;

      if (parentIndex) {
          this.dotGraph += `node_${parentIndex} -> node_${nodeId};\n`;
      }

      if (!node.isLeaf()) {
          for (let i = 0; i < node.children.length; i++) {
              this.generateDOT(node.children[i], node.keys[0].id);
          }
      }
  }

  generateGraph(filename: string): void {
      this.dotGraph = 'digraph BTree {\n';
      this.generateDOT(this.root);
      this.dotGraph += '}';
      
      console.log(this.dotGraph)
  }
}