import { defineStore } from "pinia";
import { ref } from "vue";
import { Graph } from "../engine/Graph";
import { BTree } from "../engine/BTree";

export const useCurrentSesionStore = defineStore('currentSession', () => {
  const currentGraph = ref<Graph>(new Graph());
  const currentBTree = ref<BTree<string>>(new BTree(5));

  const resetBTree = () => {
    currentBTree.value = new BTree(2);
  }

  return {
    resetBTree,
    currentGraph,
    currentBTree
  }

})