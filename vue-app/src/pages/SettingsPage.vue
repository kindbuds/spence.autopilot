<template>
  <v-container class="settings fill-height" :class="{ 'ma-0': isMdAndUp }">
    <v-row justify="center">
      <v-col cols="12" md="10" class="scrollable">
        <v-container class="ma-0 pa-0" v-if="user_loaded && settings">
          <h1 class="text-left">Settings</h1>
          <v-card elevation="0">
            <v-card-text class="pa-0">
              <SetupView
                :config="settings"
                :about_search="
                  settings.about_search ? settings.about_search : ''
                "
                context="settings"
                @submit="submitSettings"
              />
            </v-card-text>
          </v-card>
        </v-container>
        <v-container class="ma-0 pa-0 text-center" v-else>
          <v-progress-circular indeterminate :size="70" :width="7" color="grey">
          </v-progress-circular>
        </v-container>
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
      user_loaded: false,
      settings: null,
    };
  },
  mounted() {
    if (window.electron) {
      window.electron.reloadUser(this.user.token);
      window.electron.onUserReloaded(async (event, userdata) => {
        this.user_loaded = true;
        // console.log(userdata, "userdata");
        this.settings = userdata.autopilot;
      });
    }
  },
  methods: {
    submitSettings() {
      //  this.user_loaded = false;
      //  window.electron.reloadUser(this.user.token);
      // Handle the final submission of the settings
      // console.log("Setup complete:", config);
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

<style>
html.mac.settings #app {
  overflow-y: scroll !important;
}
</style>
