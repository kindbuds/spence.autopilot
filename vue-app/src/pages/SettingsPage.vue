<template>
  <v-container class="settings" :class="{ 'ma-0': isMdAndUp }">
    <v-row justify="center">
      <v-col cols="12" md="10">
        <h1 class="text-left">Settings</h1>
        <v-card elevation="0">
          <v-card-text class="pa-0">
            <SetupView
              :config="user.autopilot"
              :about_search="user.autopilot.about_search"
              context="settings"
              @submit="submitSettings"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { computed } from "vue";
import { useDisplay } from "vuetify";
import SetupView from "@/components/common/SetupView.vue";

export default {
  name: "SettingsPage",
  components: {
    SetupView,
  },
  setup() {
    const display = useDisplay();
    const isMdAndUp = computed(() => display.mdAndUp.value);

    return {
      isMdAndUp,
    };
  },
  data() {
    return {
      searchTerms: Array(10).fill(""),
    };
  },
  methods: {
    submitSettings(config) {
      // Handle the final submission of the settings
      console.log("Setup complete:", config);
    },
  },
};
</script>

<style scoped>
.settings {
  padding: 20px;
  max-width: 100vw !important;
}
</style>
