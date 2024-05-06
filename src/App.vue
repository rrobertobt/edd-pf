<template>
  <v-app
    style="min-height: 100vh;"
    theme="light"
  >
    <v-main>
      <v-snackbar v-model="snackbar">
        {{ sbMessage }}
      </v-snackbar>
      <h2 class="text-center py-6">
        <v-icon>mdi-map-outline</v-icon>
        TravelMap GT
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              class="mx-2"
              density="comfortable"
              variant="outlined"
            >
              <v-icon>mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-dialog max-width="500">
              <template #activator="{ props: activatorProps }">
                <v-list-item
                  prepend-icon="mdi-file-document-outline"
                  v-bind="activatorProps"
                >
                  <v-list-item-title>
                    Abrir archivo de entrada
                  </v-list-item-title>
                </v-list-item>
              </template>

              <template #default="{ isActive }">
                <v-card>
                  <v-card-title class="font-weight-bold mt-3 text-uppercase">
                    <v-icon>mdi-file-document-outline</v-icon>
                    Abrir archivos
                  </v-card-title>
                  <v-card-text>
                    Selecciona el archivo de rutas y el archivo de trafico para
                    comenzar una nueva sesión.

                    <v-file-input
                      v-model="routeFile"
                      class="mt-4"
                      clearable
                      label="Rutas"
                      variant="outlined"
                    />
                    <v-file-input
                      v-model="trafficFile"
                      clearable
                      label="Trafico"
                      variant="outlined"
                    />
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer />

                    <v-btn
                      text="Cancelar"
                      @click="isActive.value = false"
                    />
                    <v-btn
                      text="Continuar"
                      :disabled="!routeFile "
                      @click="processFiles(isActive)"
                    />
                  </v-card-actions>
                </v-card>
              </template>
            </v-dialog>
          </v-list>
        </v-menu>
      </h2>
      <MainApp ref="mainApp" />
    </v-main>
  </v-app>
</template>

<script setup>
import MainApp from "./components/MainApp.vue";
import { ref } from "vue";
import { useCurrentSesionStore } from "./store/currentSession";
import { storeToRefs } from "pinia";
import { Graph } from "./engine/Graph";

const mainApp = ref(null);

const { currentGraph } = storeToRefs(useCurrentSesionStore())

const snackbar = ref(false);
const sbMessage = ref("Error al procesar los archivos");
const routeFile = ref(null);
const trafficFile = ref(null);

const processFiles = (dialogShow) => {
  currentGraph.value = new Graph()
  const routeReader = new FileReader();
  const trafficReader = new FileReader();

  let routeResult = null;
  let trafficResult = null;

  routeReader.onload = (e) => {
    // console.log(e.target.result);
    routeResult = e.target.result;
    try {
      sbMessage.value = "Archivos procesados correctamente";
      snackbar.value = true;
      routeFile.value = null;
      trafficFile.value = null;
      dialogShow.value = false;
  
      const lines = routeResult.split("\n");
      currentGraph.value.buildGraph(lines)
      // console.log(currentGraph.value.generateDotGraph());  
      mainApp.value.renderGraph();
    } catch (err) {
      console.error(err);
      sbMessage.value = "Error al procesar los archivos";
      snackbar.value = true;
    }
  };
  routeReader.readAsText(routeFile.value);
  // trafficReader.onload = () => {
  //   trafficResult = trafficReader.result;
  // };
  // trafficReader.readAsText(trafficFile.value);


};
</script>

<style>
* {
  font-family: "DM Sans", sans-serif;
}
</style>
