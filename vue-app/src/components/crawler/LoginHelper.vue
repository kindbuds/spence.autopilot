<template>
  <div>
    <v-container class="ma-0 pa-0 position-relative">
      <v-alert color="primary">
        Please sign in to {{ domainFriendly }} to continue.
      </v-alert>
      <webview
        id="login-helper"
        ref="loginHelper"
        class="webview login"
        :src="url"
        useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0"
        @dom-ready="checkLogin"
        allowpopups=""
      ></webview>

      <div
        v-if="loading"
        class="overlay fill-height d-flex align-center justify-center"
      >
        <v-progress-circular
          indeterminate
          :size="70"
          :width="7"
          color="grey"
        ></v-progress-circular>
      </div>
    </v-container>
  </div>
</template>



<script>
import * as shared from "@/helpers/shared.js";
import { selectors } from "@/helpers/selectors.js";
export default {
  name: "LoginHelper",
  props: {
    url: String,
    domain: String,
    domainFriendly: String,
  },
  emits: ["login-success"],
  data() {
    return {
      webview: null,
      loading: false,
      selectors,
    };
  },
  mounted() {
    // next tick
    //  setTimeout(() => {
    this.webview = this.$refs.loginHelper;
    //  console.log(this.webview, "LoginHelper.webview");
    if (this.webview) {
      this.webview.addEventListener(
        "did-start-navigation",
        this.onNavigationStart
      );
      this.webview.addEventListener("did-navigate", this.onNavigationEnd);
    }
    // this.loading = false;
    // }, 1500);
  },
  beforeUnmount() {
    if (this.webview) {
      this.webview.removeEventListener(
        "did-start-navigation",
        this.onNavigationStart
      );
      this.webview.removeEventListener("did-navigate", this.onNavigationEnd);
    }
  },
  methods: {
    onNavigationStart(event) {
      // this.loading = true;
      const urls = [
        "https://www.linkedin.com/checkpoint/lg/login-submit",
        "https://www.linkedin.com/feed/",
        "https://www.linkedin.com/checkpoint/",
      ];
      //    console.log("Navigation started:", event.url);

      if (urls.includes(event.url)) this.loading = true;
      //this.$refs.loginHelper.classList.add("hidden");
    },
    onNavigationEnd(event) {
      //  this.loading = false;
      const urls = ["https://www.linkedin.com/feed/"];
      //    console.log("Navigation ended:", event.url);

      if (urls.includes(event.url)) this.loading = true;
    },
    async checkLogin() {
      //  setTimeout(async () => {
      //   console.log("in checkLogin");
      try {
        if (!this.webview) {
          this.webview = this.$refs.loginHelper;
          console.error("Webview is not available");
          return;
        }

        //let is2FA = false;
        const isSignedIn = await shared.checkSignInButton(
          this.webview,
          this.selectors.signInSignals
        );
        //   console.log(isSignedIn, "isSignedIn");
        // if (isSignedIn) is2FA = await shared.check2FAButton(this.webview);
        // console.log(is2FA, "is2FA");

        if (isSignedIn) {
          // this.loading = true;
          //    console.log("User is logged in");
          this.loading = true;
          // Emit an event or call another method to handle post-login logic
          this.$emit("login-success");
        } else {
          this.loading = false;
          //   console.log("User is not logged in");
          // this.$emit("login-failure");
        }
      } catch (error) {
        console.error("Error executing JavaScript in webview:", error);

        //  alert("login helper error!");
      }
      //  }, 2000);
    },
  },
};
</script>

>

<style scoped>
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #212121; /* Semi-transparent white */
}
</style>
