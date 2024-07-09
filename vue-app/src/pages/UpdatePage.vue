<template>
  <main class="d-flex align-center justify-center flex-column">
    <h2>Updating</h2>
    <p v-if="status">{{ status }}</p>
    <progress v-if="progress !== null" :value="progress" max="100"></progress>
    <button v-if="updateDownloaded" @click="restartApp">
      Restart to Apply Update
    </button>
  </main>
</template>

<script>
export default {
  data() {
    return {
      status: "Checking for updates...",
      progress: null,
      updateDownloaded: false,
    };
  },
  created() {
    window.electron.onUpdateAvailable(() => {
      this.status = "Update available. Downloading...";
    });
    window.electron.onUpdateProgress((progress) => {
      this.progress = progress.percent;
      this.status = `Downloading update... ${progress.percent}%`;
    });
    window.electron.onUpdateDownloaded(() => {
      this.status = "Update downloaded.";
      this.updateDownloaded = true;
    });
  },
  methods: {
    restartApp() {
      window.electron.restartApp();
    },
  },
};
</script>

<style scoped>
.d-flex.flex-column {
  flex-direction: column;
}
progress {
  width: 100%;
  margin: 20px 0;
}
button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
