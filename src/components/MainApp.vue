<template>
  <div class="px-16 ">
    <v-row style="min-height: 90vh;">
      <v-col
        cols="3"
        class="w-100 h-100"
      >
        <v-alert
          v-if="currentGraph.isEmpty()"
          variant="tonal"
          color="warning"
          icon="mdi-information"
          class="mb-6"
        >
          No hay datos cargados aún, selecciona archivos de entrada
          para comenzar una sesión.
        </v-alert>
        <div>
          <span class="d-block mb-2">
            <v-icon size="small">mdi-map-marker-outline</v-icon>
            Origen
          </span>
          <v-autocomplete
            v-model="origin"
            clearable
            :items="currentGraph.getNodes()"
            item-title="name"
            density="comfortable"
            variant="outlined"
          />
        </div>
        <div>
          <span class="d-block mb-2">
            <v-icon size="small">mdi-map-marker-radius-outline</v-icon>
            Destino
          </span>
          <v-autocomplete
            v-model="destination"
            clearable
            :items="currentGraph.getNodes()"
            item-title="name"
            density="comfortable"
            variant="outlined"
          />
        </div>
        <div>
          <span class="d-block mb-2">
            <v-icon size="small">mdi-car-outline</v-icon>
            Tipo de transporte
          </span>
          <v-select
            density="comfortable"
            :items="['Vehiculo', 'Caminando']"
            variant="outlined"
          />
        </div>
        <v-btn
          block
          variant="tonal"
          class="mb-6"
          append-icon="mdi-arrow-right"
          :disabled="!origin || !destination"
          @click="startTrip"
        >
          Iniciar recorrido
        </v-btn>

        <v-dialog>
          <template #activator="{ props: activatorProps }">
            <v-btn
              block
              variant="tonal"
              append-icon="mdi-tree"
              :disabled="!tripStarted"
              v-bind="activatorProps"
              @click="showTreeDialog"
            >
              Ver árbol rutas
            </v-btn>
          </template>

          <template #default="{ isActive }">
            <v-card
              title="Arbol B de rutas:"
              height="500px"
            >
              <v-card-text>
                <div
                  ref="treeContainer"
                  style="height: 350px;"
                  class="treeContainer"
                />
              </v-card-text>

              <v-card-actions>
                <v-spacer />

                <v-btn
                  text="Cerrar"
                  @click="isActive.value = false"
                />
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>
      </v-col>

      <v-col
        cols=""
        class="w-100 h-100"
      >
        <div
          ref="mapContainer"
          style="height: 85vh;"
          class="mapContainer"
        />
      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import svgPanZoom from 'svg-pan-zoom'
import { useCurrentSesionStore } from '../store/currentSession';
import { storeToRefs } from 'pinia';
import { instance } from "@viz-js/viz";

const treeContainer = ref<HTMLDivElement|null>(null);
const { currentGraph, currentBTree } = storeToRefs(useCurrentSesionStore())
const { resetBTree } = useCurrentSesionStore()

const tripStarted = ref(false);
const origin = ref();
const destination = ref();
const transportType = ref(null);

const startTrip = () => {
  tripStarted.value = true;
  const possibleRoutes = currentGraph.value.findAllRoutes(origin.value, destination.value);
  const possibleRoutesString = possibleRoutes.map(route =>
    route.map(edge => edge.origin.name)
         .concat(route[route.length - 1].destination.name)
         .join(' = ')
);
  resetBTree();
  possibleRoutesString.forEach(route => currentBTree.value.insert(route));
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
      console.log('loaded');
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
