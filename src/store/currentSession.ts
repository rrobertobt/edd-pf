import { defineStore } from "pinia";
import { ref } from "vue";
import { Graph } from "../engine/Graph";

export const useCurrentSesionStore = defineStore('currentSession', () => {
  const currentGraph = ref<Graph>(new Graph());

  return {
    currentGraph
  }

})