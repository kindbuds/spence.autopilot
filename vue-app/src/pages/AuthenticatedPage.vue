<template>
  <main class="authenticated">
    <!-- <h1>You've been authenticated!</h1> -->
  </main>
</template>

<script>
export default {
  name: "AuthenticatedPage",
  mounted() {
    const fullUrl = window.location.search;

    if (window.electron) {
      window.electron.sendAuthCallback(fullUrl);

      window.electron.onAuthComplete(() => {
        this.$store.dispatch("loadUser");
      });
    }
  },
};
</script>

<style scoped>
.authenticated {
  padding: 20px;
}
</style>
