<template>
  <div class="px-16 ">
    <v-row style="min-height: 90vh;">
      <v-col cols="3" class="w-100 h-100">
        <v-alert v-if="currentGraph.isEmpty()" variant="tonal" color="warning" icon="mdi-information" class="mb-6">
          No hay datos cargados aún, selecciona archivos de entrada
          para comenzar una sesión.
        </v-alert>
        <div>
          <span class="d-block mb-2">
            <v-icon size="small">mdi-map-marker-outline</v-icon>
            Origen
          </span>
          <v-autocomplete v-model="origin" clearable :items="currentGraph.getNodes()" item-title="name"
            density="comfortable" variant="outlined" />
        </div>
        <div>
          <span class="d-block mb-2">
            <v-icon size="small">mdi-map-marker-radius-outline</v-icon>
            Destino
          </span>
          <v-autocomplete v-model="destination" clearable :items="currentGraph.getNodes()" item-title="name"
            density="comfortable" variant="outlined" />
        </div>
        <div>
          <span class="d-block mb-2">
            <v-icon size="small">mdi-car-outline</v-icon>
            Tipo de transporte
          </span>
          <v-select v-model="transportType" density="comfortable"
            :items="[{ title: 'Vehículo', value: 'vehicle' }, { title: 'A pie', value: 'walking' }]"
            variant="outlined" />
        </div>
        <div>
          <span class="d-block mb-2">
            <v-icon size="small">mdi-sort-numeric-ascending</v-icon>
            Critero de selección (mejor y peor ruta)
          </span>
          <v-select v-model="criteria" :disabled="!origin || !destination || !transportType" density="comfortable"
            :items="posibleCriteria" variant="outlined" />
        </div>
        <v-btn block variant="tonal" class="mb-6" append-icon="mdi-arrow-right" color="yellow-darken-4"
          :disabled="!origin || !destination || !transportType || !criteria" @click="startTrip">
          Iniciar recorrido
        </v-btn>

        <v-dialog>
          <template #activator="{ props: activatorProps }">
            <v-btn block variant="tonal" append-icon="mdi-tree" :disabled="!tripStarted" v-bind="activatorProps"
              @click="showTreeDialog">
              Ver árbol rutas
            </v-btn>
          </template>

          <template #default="{ isActive }">
            <v-card title="Arbol B de rutas:" height="700px">
              <v-card-text>
                <div ref="treeContainer" style="height: 550px;" class="treeContainer" />
              </v-card-text>

              <v-card-actions>
                <v-spacer />

                <v-btn text="Cerrar" @click="isActive.value = false" />
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
      </v-col>

      <v-col cols="" class="w-100 h-100">
        <div ref="mapContainer" style="height: 85vh;" class="mapContainer" />
      </v-col>
      <v-col cols="2" v-if="bestRoute && worstRoute">
        <h4>
          Mejor ruta: <br> <span class="font-weight-light">{{ bestRoute }}</span>
        </h4>

        <v-dialog>
          <template #activator="{ props: activatorProps }">
            <v-btn block variant="tonal" class="my-4" append-icon="mdi-arrow-right" color="red-darken-2"
          @click="showBestRouteDialog"
          v-bind="activatorProps"
          >
          Mostrar grafo
        </v-btn>
          </template>

          <template #default="{ isActive }">
            <v-card title="Mejor ruta" height="700px">
              <v-card-text>
                <div ref="bestRouteContainer" style="height: 550px;" class="bestRouteContainer" />
              </v-card-text>

              <v-card-actions>
                <v-spacer />

                <v-btn text="Cerrar" @click="isActive.value = false" />
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>

        <h4>
          Peor ruta: <br> <span class="font-weight-light">{{ worstRoute }}</span>
        </h4>
        <!-- <v-btn block variant="tonal" class="my-4" append-icon="mdi-arrow-right" color="red-darken-2"
          @click="renderGraph">
          Mostrar grafo
        </v-btn> -->
        <v-dialog>
          <template #activator="{ props: activatorProps }">
            <v-btn block variant="tonal" class="my-4" append-icon="mdi-arrow-right" color="red-darken-2"
          @click="showWorstRouteDialog"
          v-bind="activatorProps"
          >
          Mostrar grafo
        </v-btn>
          </template>

          <template #default="{ isActive }">
            <v-card title="Peor ruta" height="700px">
              <v-card-text>
                <div ref="worstRouteContainer" style="height: 550px;" class="worstRouteContainer" />
              </v-card-text>

              <v-card-actions>
                <v-spacer />

                <v-btn text="Cerrar" @click="isActive.value = false" />
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>

      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import svgPanZoom from 'svg-pan-zoom'
import { useCurrentSesionStore } from '../store/currentSession';
import { storeToRefs } from 'pinia';
import { instance } from "@viz-js/viz";
import { Edge } from '../engine/Graph';

const emits = defineEmits(['snackbar']);
const treeContainer = ref<HTMLDivElement | null>(null);
const bestRouteContainer = ref<HTMLDivElement | null>(null);
const worstRouteContainer = ref<HTMLDivElement | null>(null);

const { currentGraph, currentBTree } = storeToRefs(useCurrentSesionStore())
const { resetBTree } = useCurrentSesionStore()

const bestRoute = ref<string>()
const bestRouteDot = ref<string>()
const worstRoute = ref<string>()
const worstRouteDot = ref<string>()

const tripStarted = ref(false);
const origin = ref();
const destination = ref();
const transportType = ref(null);
const criteria = ref(null);

const posibleCriteria = computed(() => {
  if (transportType.value === 'vehicle') {
    return [{ title: 'Distancia', value: 'distance' }, { title: 'Gasolina', value: 'gas' }, { title: 'Gasolina y distancia', value: 'gas-distance' }]
  }
  return [{ title: 'Distancia', value: 'distance' }, { title: 'Desgaste Físico', value: 'physical' }, { title: 'Desgaste Físico y distancia', value: 'physical-distance' }]
})

const startTrip = () => {
  tripStarted.value = true;
  // const possibleRoutes = currentGraph.value.findAllRoutes(origin.value, destination.value);
  // const possibleRoutesString = possibleRoutes.map(route =>
  //   route.map(edge => edge.origin.name)
  //     .concat(route[route.length - 1].destination.name)
  //     .join(' = ')
  // );
  // resetBTree();
  // possibleRoutesString.forEach(route => currentBTree.value.insert(route));
  // if (possibleRoutes.length === 0) {
  //   emits('snackbar', { message: `No hay rutas posibles de ${origin.value} a ${destination.value}` });
  //   bestRoute.value = undefined;
  //   worstRoute.value = undefined;
  //   return;
  // }
  let routes: { best: Edge[] | null, worst: Edge[] | null, bestMetric: number, worstMetric: number, bestNodeString: string, worstNodeString: string, allPossibleRoutes: Edge[][], bestRouteDot: string, worstRouteDot: string };
  if (transportType.value === 'vehicle') {
    if (criteria.value === 'distance') {
      routes = currentGraph.value.findBestAndWorstRoute('vehicle', origin.value, destination.value, 'distance');
    } else if (criteria.value === 'gas') {
      routes = currentGraph.value.findBestAndWorstRoute('vehicle', origin.value, destination.value, 'gasoline');
    } else if (criteria.value === 'gas-distance') {
      routes = currentGraph.value.findBestAndWorstRoute('vehicle', origin.value, destination.value, 'distance', 'gasoline');
    }
  } else {
    if (criteria.value === 'distance') {
      routes = currentGraph.value.findBestAndWorstRoute('walking', origin.value, destination.value, 'distance');
    } else if (criteria.value === 'physical') {
      routes = currentGraph.value.findBestAndWorstRoute('walking', origin.value, destination.value, 'physicalWear');
    } else if (criteria.value === 'physical-distance') {
      routes = currentGraph.value.findBestAndWorstRoute('walking', origin.value, destination.value, 'physicalWear', 'distance');
    }

  }
  bestRoute.value = routes?.bestNodeString;
  worstRoute.value = routes?.worstNodeString;
  if (routes?.allPossibleRoutes.length > 0) {
    resetBTree();
    routes.allPossibleRoutes.forEach(route => currentBTree.value.insert(route.map(edge => edge.origin.name).concat(route[route.length - 1].destination.name).join(' = ')));
    bestRouteDot.value = routes.bestRouteDot;
    worstRouteDot.value = routes.worstRouteDot;
  }
}

const lastSvgTree = ref(null);
const lastEventListenerTree = ref(null);
const showTreeDialog = () => {
  instance().then(viz => {
    if (lastSvgTree.value) {
      svgPanZoom(lastSvgTree.value).destroy()
      lastSvgTree.value.removeEventListener('load', lastEventListenerTree)
    }
    treeContainer.value.innerHTML = '';
    lastEventListenerTree.value = null;
    lastSvgTree.value = null;

    const svg = viz.renderSVGElement(currentBTree.value.generateGraph(), { engine: 'dot' })
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    lastEventListenerTree.value = () => {
      // console.log('loaded');
      svgPanZoom(svg, {
        zoomEnabled: true,
        controlIconsEnabled: true,
      })
    }
    treeContainer.value.appendChild(svg);
    lastEventListenerTree.value();
    lastSvgTree.value = svg;
  })
}

const lastSvgBestRoute = ref(null);
const lastEventListenerBestRoute = ref(null);
const showBestRouteDialog = () => {
  instance().then(viz => {
    if (lastSvgBestRoute.value) {
      svgPanZoom(lastSvgBestRoute.value).destroy()
      lastSvgBestRoute.value.removeEventListener('load', lastEventListenerBestRoute)
    }
    bestRouteContainer.value.innerHTML = '';
    lastEventListenerBestRoute.value = null;
    lastSvgBestRoute.value = null;

    const svg = viz.renderSVGElement(bestRouteDot.value, { engine: 'circo' })
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    lastEventListenerBestRoute.value = () => {
      // console.log('loaded');
      svgPanZoom(svg, {
        zoomEnabled: true,
        controlIconsEnabled: true,
      })
    }
    bestRouteContainer.value.appendChild(svg);
    lastEventListenerBestRoute.value();
    lastSvgBestRoute.value = svg;
  })
}

const lastSvgWorstRoute = ref(null);
const lastEventListenerWorstRoute = ref(null);
const showWorstRouteDialog = () => {
  instance().then(viz => {
    if (lastSvgWorstRoute.value) {
      svgPanZoom(lastSvgWorstRoute.value).destroy()
      lastSvgWorstRoute.value.removeEventListener('load', lastEventListenerWorstRoute)
    }
    worstRouteContainer.value.innerHTML = '';
    lastEventListenerWorstRoute.value = null;
    lastSvgWorstRoute.value = null;

    const svg = viz.renderSVGElement(worstRouteDot.value, { engine: 'circo' })
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    lastEventListenerWorstRoute.value = () => {
      // console.log('loaded');
      svgPanZoom(svg, {
        zoomEnabled: true,
        controlIconsEnabled: true,
      })
    }
    worstRouteContainer.value.appendChild(svg);
    lastEventListenerWorstRoute.value();
    lastSvgWorstRoute.value = svg;
  })
}

const lastSvg = ref(null);
const lastEventListener = ref(null);
function renderGraph() {
  const mapContainer = document.querySelector('.mapContainer');
  instance().then(viz => {
    if (currentGraph.value.isEmpty()) return;

    if (lastSvg.value) {
      svgPanZoom(lastSvg.value).destroy()
      lastSvg.value.removeEventListener('load', lastEventListener)
    }
    mapContainer.innerHTML = '';
    lastEventListener.value = null;
    lastSvg.value = null;

    const svg = viz.renderSVGElement(currentGraph.value.generateDotGraph(), { engine: 'circo' });
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    lastEventListener.value = () => {
      console.log('loaded');
      svgPanZoom(svg, {
        zoomEnabled: true,
        controlIconsEnabled: true,
      })
    }
    mapContainer.appendChild(svg);
    lastEventListener.value();
    lastSvg.value = svg;
  })
}


defineExpose({
  renderGraph
})
</script>
<style lang="scss" scoped></style>
