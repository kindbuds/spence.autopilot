<template>
  <div class="fill-height">
    <v-container v-if="loading" class="fill-height" fluid>
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
    <v-container v-else class="ma-0 pa-0">
      <v-row no-gutters>
        <v-col v-if="!isMdAndUp" cols="1" class="text-center">
          <v-btn
            elevation="0"
            @click="closeIndividualJobDetail"
            icon="mdi-arrow-left"
            class="mt-1"
            size="small"
            color="transparent"
          ></v-btn>
        </v-col>
        <v-col v-if="false" cols="0" class="text-center">
          <v-btn
            color="transparent"
            class="text-grey mr-2"
            icon="mdi-card-account-details-star-outline"
            title="Resume (CV)"
            size="small"
          >
          </v-btn>
          <v-btn
            color="transparent"
            class="text-grey"
            icon="mdi-email-heart-outline"
            title="Cover Letter"
          >
          </v-btn>
        </v-col>
        <v-col cols="10" class="d-flex align-center">
          <span
            class="address-bar"
            v-bind:style="{
              userSelect: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '50%',
            }"
          >
            {{ currentUrl }}
          </span>
          <v-btn
            color="transparent"
            class="text-grey"
            @click="copyUrlToClipboard"
            icon="mdi-content-copy"
          >
          </v-btn>
        </v-col>
        <v-col cols="1" class="text-center">
          <v-btn
            elevation="0"
            @click="closeIndividualJobDetail"
            icon="mdi-close"
            class="mr-4 mt-1"
            size="small"
            color="transparent"
          ></v-btn> </v-col
      ></v-row>
    </v-container>
    <webview
      ref="jobWebView"
      :src="currentUrl"
      :style="!isMdAndUp ? 'width: 100vw' : 'width:100%'"
      class="fill-height bg-white"
      @dom-ready="onDomReady"
      @did-start-loading="onStartLoading"
      @did-stop-loading="onStopLoading"
      @will-navigate="handleNavigation"
      @did-navigate="handleNavigation"
      :webpreferences="'nodeIntegration=yes,nativeWindowOpen=true'"
    ></webview>
  </div>
</template>

<script>
import { useDisplay } from "vuetify";
import { computed } from "vue";
import * as shared from "@/helpers/shared.js";

export default {
  name: "IndividualJobWebView",
  props: {
    url: {
      type: String,
      required: false,
      default: null,
    },
  },
  emits: ["jobDetailClosed", "auth-required"],
  setup() {
    const display = useDisplay();
    const isMdAndUp = computed(() => display.mdAndUp.value);

    return {
      isMdAndUp,
    };
  },
  data() {
    return {
      applyUrl: null,
      loading: true,
      lastLoadedUrl: null,
      stopLoadingTimeout: null,
      isLoading: false, // New flag to track loading state
      currentUrl: this.url,
    };
  },
  mounted() {
    window.electron.onNewWindowRequest((newUrl) => {
      console.log(`New window requested for URL: ${newUrl}`);
      this.currentUrl = newUrl;
      this.reloadWebView();
    });
  },
  watch: {
    url(newUrl) {
      console.log(`URL changed: ${newUrl}`);
      if (newUrl !== this.lastLoadedUrl) {
        console.log(
          `New URL is different from last loaded URL: ${this.lastLoadedUrl}. Reloading webview.`
        );
        this.currentUrl = newUrl;
        this.reloadWebView();
      } else {
        console.log(
          `New URL is the same as last loaded URL: ${this.lastLoadedUrl}. Not reloading webview.`
        );
        this.loading = false;
      }
    },
  },
  created() {
    if (this.url) {
      console.log(`Initial URL: ${this.url}`);
      this.currentUrl = this.url;
      this.reloadWebView();
    }
  },
  methods: {
    handleNavigation() {
      // const url = event.url;
      // alert(`url: ${url}`);
      // Option 1: Open in a new Electron window
      // const newWindow = new window.require("electron").remote.BrowserWindow();
      // newWindow.loadURL(url);
      // Option 2: Navigate the webview to the new URL
      // this.testPageUrl = url;
    },
    onWillNavigate(event) {
      const newUrl = event.url;
      console.log(`Will navigate to URL: ${newUrl}`);
      this.currentUrl = newUrl;
    },
    onDidNavigate(event) {
      const newUrl = event.url;
      console.log(`Did navigate to URL: ${newUrl}`);
      this.currentUrl = newUrl;
    },
    copyUrlToClipboard() {
      navigator.clipboard
        .writeText(this.currentUrl)
        .then(() => {
          console.log("URL copied to clipboard");
        })
        .catch((err) => {
          console.error("Could not copy text: ", err);
        });
    },
    closeIndividualJobDetail() {
      this.$emit("jobDetailClosed");
    },
    // onNewWindow(event) {
    //   const newUrl = event.url;
    //   console.log(`New window requested for URL: ${newUrl}`);
    //   // Load the new URL in the same webview
    //   this.currentUrl = newUrl;
    //   this.reloadWebView();
    // },
    reloadWebView() {
      console.log("Reloading webview...");
      this.loading = true;
      this.isLoading = true; // Set the flag to true when reloading
      this.$nextTick(() => {
        const webview = this.$refs.jobWebView;
        if (webview) {
          console.log(`Setting webview src to: ${this.currentUrl}`);
          webview.src = this.currentUrl;
        }
      });
    },
    async onDomReady() {
      console.log("DOM is ready.");
      const webview = this.$refs.jobWebView;
      if (!webview) {
        console.error("Webview not initialized");
      } else {
        this.currentUrl = webview.src;
        webview
          .executeJavaScript(
            `
      (function() {
        const elements = document.querySelectorAll('code[id^="bpr-guid-"]');
        const parsedDataArray = [];

        elements.forEach(element => {
          const jsonData = element.innerText;
          try {
            const parsedData = JSON.parse(jsonData);
            parsedDataArray.push(parsedData);
          } catch (e) {
            console.error('Failed to parse JSON:', e);
          }
        });

        // Filter the parsed data array for objects containing 'data.applyMethod.companyApplyUrl'
        const filteredDataArray = parsedDataArray.filter(d => {
          return d.data.applyMethod && d.data.applyMethod.companyApplyUrl;
        })[0];

        return filteredDataArray ? filteredDataArray.data.applyMethod.companyApplyUrl : null;
      })();
    `
          )
          .then((applyUrl) => {
            if (applyUrl) {
              console.log("Apply Url:", applyUrl);
              this.applyUrl = applyUrl;
              // Add event listeners to the buttons
              setTimeout(() => {
                this.addButtonListeners();
              }, 5000);
            } else {
              console.error("No data found with the specified value.");
            }
          });
      }
    },

    addButtonListeners() {
      const script = `
      const buttons = document.querySelectorAll("button.jobs-apply-button");
      console.log(buttons,'buttons')
      buttons.forEach((button) => {
        const ariaLabel = button.getAttribute("aria-label");
        if (!ariaLabel || !ariaLabel.startsWith("Easy Apply")) {
          button.addEventListener("click", () => {
            // alert('${this.applyUrl}');
            window.location.href = '${this.applyUrl}';
          });
        }
      });
    `;

      const webview = this.$refs.jobWebView;
      if (webview) {
        webview.executeJavaScript(script);
      }
    },
    onStartLoading() {
      const webview = this.$refs.jobWebView;
      if (webview) {
        console.log("Webview started loading.", webview.src);
        if (webview.src === "https://www.linkedin.com/feed/") {
          webview.src = this.url;
        }
      }

      if (!this.isLoading) {
        this.removeUnwantedElements();
        // Set the flag to true when loading starts
      }
    },
    removeUnwantedElements() {
      setTimeout(() => {
        const webview = this.$refs.jobWebView;
        if (!webview) return;
        const removeElementsScript = `
            document.querySelector('.scaffold-layout-toolbar')?.remove();
            document.querySelector('.scaffold-layout__list')?.remove();
            document.querySelector('.scaffold-layout__detail-back-button')?.remove();
            document.querySelector('#msg-overlay')?.remove();
            document.querySelector('button.scaffold-layout__detail-back-button')?.remove();
      `;
        webview.executeJavaScript(removeElementsScript);
      }, 1000);
    },
    async onStopLoading() {
      if (this.isLoading) {
        if (this.stopLoadingTimeout) {
          clearTimeout(this.stopLoadingTimeout);
        }

        this.stopLoadingTimeout = setTimeout(async () => {
          await this.verifyLoadingAnimationCompleted();
          console.log("Webview stopped loading.");

          this.removeUnwantedElements();

          setTimeout(() => {
            this.loading = false;
            this.isLoading = false;
          }, 2000);
          // Set the flag to false when loading stops
          if (this.url) {
            this.lastLoadedUrl = this.url;
            console.log(`Updated lastLoadedUrl to: ${this.lastLoadedUrl}`);

            const webview = this.$refs.jobWebView;
            if (webview) {
              const loggedIn = await shared.checkSignInButton(webview);
              console.log(loggedIn, "onDomReady.loggedIn");
              if (!loggedIn) {
                //  alert("auth-required1");
                this.$emit("auth-required");
              }
            }
          }
        }, 300); // Debounce time to prevent multiple calls
      }
    },
    async waitForElementToDisappear(webview, selector) {
      await webview.executeJavaScript(`
          new Promise((resolve) => {
            const checkElement = () => {
              const element = document.querySelector('${selector}');
              if (!element || element.offsetParent === null) {
                resolve();
              } else {
                setTimeout(checkElement, 100);
              }
            };
            checkElement();
          });
        `);
    },
    async verifyLoadingAnimationCompleted() {
      const webview = this.$refs.jobWebView;
      if (!webview) return;
      await this.waitForElementToDisappear(
        webview,
        "div.initial-load-animation"
      );
    },
  },
};
</script>

<style scoped>
webview {
  border: none;
  transition: opacity 0.3s ease-in-out;
}
.fill-height {
  transition: opacity 0.3s ease-in-out;
}
.address-bar {
  border: 1px solid #636363;
  border-radius: 3px;
  padding: 5px;
  margin-left: 10px;
  color: grey;
}
</style>
