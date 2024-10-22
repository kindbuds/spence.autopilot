<template>
  <main
    class="login d-flex align-center justify-center flex-column fill-height"
    style="height: calc(100vh - 124px) !important; min-height: 300px"
  >
    <div style="color: #2d2d2d">
      <p v-if="isMac">This is macOS.</p>
      <p v-if="isWindows">This is Windows.</p>
    </div>

    <v-btn
      class="login-button"
      variant="outlined"
      size="x-large"
      rounded="xl"
      @click="redirectToLogin"
      style="margin-bottom: 25px"
      >Login</v-btn
    >
    <v-btn
      class="login-button"
      color="orange-lighten-3"
      variant="outlined"
      size="x-large"
      rounded="xl"
      @click="redirectToJoin"
      style="margin-bottom: 25px"
      >Join</v-btn
    >
  </main>
</template>
<script>
export default {
  name: "LoginPage",
  components: {},
  data() {
    return {
      baseDomain: window.electron.SPENCE_DOMAIN
        ? window.electron.SPENCE_DOMAIN
        : "https://app.getspence.ai/",
    };
  },
  async mounted() {
    // console.log(this.user, "this.user");
  },
  methods: {
    redirectToLogin() {
      window.location.href = `${this.baseDomain}login/?autopilot=true`;
    },
    redirectToJoin() {
      window.location.href = `${this.baseDomain}join/?autopilot=true`;
    },
  },
};
</script>

<style scoped>
.login {
  padding: 20px;
}
.login-button {
  margin: 5px;
  width: 250px;
}
.d-flex.flex-column {
  flex-direction: column;
}
</style>

<style>
html,
body {
  overflow-y: scroll !important;
}
</style>