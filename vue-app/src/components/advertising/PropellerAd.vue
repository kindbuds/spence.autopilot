<template>
  <span></span>
</template>

<script>
// import { useHead } from "@vueuse/head";
import { onMounted, onBeforeUnmount } from "vue";

export default {
  name: "PropellerAd",
  props: {
    shouldShowAd: {
      type: Boolean,
      default: true, // Control based on user type, e.g., non-premium users
    },
  },
  setup() {
    const scriptName = "//thubanoa.com/1?z=8439341";
    // const additionalScriptBase = "https://thubanoa.com";
    const adDomain = "thubanoa";
    const adContainerSelector = "#p_8439341";
    const importantChildSelector = `${adContainerSelector} > div > div`; // Selector for the important child element

    function loadAdScript() {
      if (!document.querySelector(`script[src="${scriptName}"]`)) {
        const script = document.createElement("script");
        script.async = true;
        script.setAttribute("data-cfasync", "false");
        script.src = scriptName;
        document.head.appendChild(script);
        console.log("Ad script loaded.");
      }
    }

    function removeAdElements() {
      const adScripts = document.querySelectorAll(`script[src*="${adDomain}"]`);
      adScripts.forEach((script) => {
        script.remove();
        console.log("Ad script removed:", script.src);
      });

      const adContainer = document.querySelector(adContainerSelector);
      if (adContainer) {
        adContainer.remove();
        console.log("Ad container removed.");
      }
    }

    function monitorAdRemoval() {
      const adContainer = document.querySelector(adContainerSelector);

      if (adContainer) {
        const observer = new MutationObserver(() => {
          // Check if the important child element is missing
          const importantChild = document.querySelector(importantChildSelector);
          if (!importantChild) {
            console.log("Ad content closed by user.");
            alert("Ad content closed by user.");
            removeAdElements(); // Cleanup all ad elements when ad is closed
          }
        });

        // Observe for changes in child elements within the ad container
        observer.observe(adContainer, { childList: true, subtree: true });

        onBeforeUnmount(() => {
          observer.disconnect();
          removeAdElements();
        });
      }
    }

    onMounted(() => {
      loadAdScript();
      setTimeout(() => {
        monitorAdRemoval();
      }, 3000);
    });
  },
  data() {
    return {
      showDialog: false, // Controls the visibility of the dialog
    };
  },
  mounted() {
    if (this.shouldShowAd) {
      this.showDialog = true; // Show dialog on load if shouldShowAd is true
      this.$nextTick(() => {
        // Wait until the DOM is fully updated before accessing adPlaceholder
        this.insertAdScript();
      });
    }
  },
  methods: {
    insertAdScript() {
      // const script = document.createElement("script");
      // script.src = "https://ads.propellerads.com/script.js"; // Replace with your actual PropellerAds script URL
      // script.async = true;
      // script.defer = true;
      // this.$refs.adPlaceholder.appendChild(script);
    },
    closeDialog() {
      this.showDialog = false; // Hide the dialog when the close button is clicked
    },
  },
};
</script>

<style scoped>
.ad-container {
  width: 100%;
  text-align: center;
}
</style>
