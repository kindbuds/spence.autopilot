<template>
  <main class="logout">
    <!-- <h1>Logging out</h1> -->
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
  </main>
</template>

<script>
export default {
  name: "LogoutPage",
  components: {},
  async mounted() {
    await window.electron.logout();
  },
};
</script>

<style scoped>
.logout {
  padding: 20px;
}
</style>
