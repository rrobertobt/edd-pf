<template>
  <div class="px-16 ">
    <v-row style="min-height: 90vh;">
      <v-col
        cols="2"
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
          append-icon="mdi-arrow-right"
          :disabled="!origin || !destination"
          @click="startTrip"
        >
          Iniciar recorrido
        </v-btn>
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
const { currentGraph } = storeToRefs(useCurrentSesionStore())

const origin = ref();
const destination = ref();
const transportType = ref(null);

const startTrip = () => {
  console.log('start trip');
  currentGraph.value.showAvailableOptions(origin.value, destination.value);
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
