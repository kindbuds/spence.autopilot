<template>
  <v-dialog v-model="showDialog" persistent max-width="500">
    <v-card>
      <v-card-title class="headline">Sponsored Content</v-card-title>
      <v-card-text>
        <div class="ad-container">
          <!-- This is where the PropellerAds script will be inserted -->
          <div rel="adPlaceholder" ref="adPlaceholder"></div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="closeDialog">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "PropellerAd",
  props: {
    shouldShowAd: {
      type: Boolean,
      default: true, // Control based on user type, e.g., non-premium users
    },
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
      const script = document.createElement("script");
      script.src = "https://ads.propellerads.com/script.js"; // Replace with your actual PropellerAds script URL
      script.async = true;
      script.defer = true;
      this.$refs.adPlaceholder.appendChild(script);
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
