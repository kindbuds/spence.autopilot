<template>
  <div>
    <v-app>
      <v-navigation-drawer
        v-if="this.user2 && this.user2.autopilot"
        app
        v-model="drawer"
        :clipped="isMdAndUp"
        fixed
        :permanent="isMdAndUp && showDrawer"
      >
        <NavBar :user2="user2" />
      </v-navigation-drawer>

      <v-app-bar dense>
        <template v-if="showDrawer">
          <v-app-bar-nav-icon
            v-if="this.user2 && this.user2.autopilot"
            @click.stop="drawer = !drawer"
          ></v-app-bar-nav-icon>
        </template>

        <div class="logo-container">
          <img
            src="https://dt0651nvi2bbs.cloudfront.net/spence-face.png"
            alt="Spence"
            class="spence-image"
          />
          <img
            src="https://dt0651nvi2bbs.cloudfront.net/just-spence.png"
            alt="Just Spence"
            class="logo-image"
          />
        </div>
        <div class="text-container" v-if="isMdAndUp">
          <span class="slashes">//</span>
          <span class="autopilot-text">autopilot</span>
        </div>

        <v-spacer></v-spacer>

        <!-- Refresh Button -->
        <v-btn
          color="grey"
          v-if="isDevelopment"
          @click="refreshPage"
          icon="mdi-refresh"
        ></v-btn>

        <!-- Full Screen Button -->
        <v-btn color="grey" v-if="!isMdAndUp" icon @click="toggleFullScreen">
          <v-icon>mdi-fullscreen</v-icon>
        </v-btn>
        <v-btn color="grey" v-else icon @click="toggleNarrowWidth">
          <v-icon>mdi-dock-right</v-icon>
        </v-btn>

        <v-btn color="grey" v-if="user2 && !user2.autopilot" icon to="/logout">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </v-app-bar>

      <v-main
        class="main-container fill-height"
        style="background-color: #212121"
      >
        <template v-if="authRequired && !user2">
          <v-container class="fill-height" fluid>
            <v-row class="fill-height" align="center" justify="center">
              <v-col class="text-center">
                <v-progress-circular
                  indeterminate
                  :size="70"
                  :width="7"
                  color="grey"
                ></v-progress-circular>
              </v-col>
            </v-row>
          </v-container>
        </template>
        <template v-else>
          <router-view class="scrollable"></router-view>
          <slot></slot>
          <slot name="selectedJob"></slot>
          <!-- Named slot for selectedJob -->
        </template>
      </v-main>
      <Footer />
    </v-app>
  </div>
</template>

<script>
import { computed } from "vue";
import NavBar from "@/components/common/NavbarView.vue";
import Footer from "@/components/common/FooterView.vue";
import { useDisplay } from "vuetify";

export default {
  components: {
    NavBar,
    Footer,
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
      user2: null,
      drawer: false,
      // authRequired: false,
    };
  },
  mounted() {
    // alert(this.isMdAndUp);
    this.drawer = this.isMdAndUp;

    // this.updateDrawerState();
  },
  created() {
    window.electron.onUpdateAvailable(() => {
      this.$router.push("/update");
    });
    window.electron.onUpdateDownloaded(() => {
      this.$router.push("/home");
    });

    this.$store.dispatch("loadUser");

    this.$store.watch(
      function (state) {
        return state.user;
      },
      (value) => {
        // console.log(value, " setting this.user");
        this.user2 = value;
      },
      {
        deep: true, //add this if u need to watch object properties change etc.
      }
    );

    // this.$store.watch(
    //   (state) => state.authRequired,
    //   (value) => {
    //     console.log(value, " setting this.authRequired");
    //     this.authRequired = value;
    //   },
    //   {
    //     deep: true, // add this if you need to watch object properties change etc.
    //   }
    // );
  },
  computed: {
    showDrawer() {
      return this.isMdAndUp || (this.user2 && this.user2.autopilot);
    },
    authRequired() {
      return this.$store.state.authRequired;
    },
  },
  watch: {
    isMdAndUp(newVal) {
      this.drawer = newVal;
    },
  },
  methods: {
    updateDrawerState(isMdAndUp) {
      this.drawer = isMdAndUp;
    },
    toggleFullScreen() {
      window.electron.toggleFullScreen();
    },
    toggleNarrowWidth() {
      window.electron.toggleNarrowWidth();
    },
    refreshPage() {
      if (window) window.location.reload();
    },
  },
};
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.scrollable {
  overflow-y: auto !important;
  height: 100vh !important;
}

.spence-image {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  border: 2px solid #fff1d8;
  border-radius: 50%;
}

.logo-image {
  width: 85px;
  padding-top: 4px;
}

.slashes {
  font-size: 22px;
  color: grey;
  margin-left: 0px;
  margin-right: 6px;
}

.autopilot-text {
  font-size: 24px;
  padding-bottom: 3px;
  font-weight: bold;
  color: #8d8d8d;
}

.logo-container {
  width: 140px;
  display: flex;
  align-items: center;
  margin-left: 20px;
}

.text-container {
  display: flex;
  align-items: center;
  padding-bottom: 6px;
}
</style>
