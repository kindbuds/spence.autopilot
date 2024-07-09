<template>
  <main
    class="login d-flex align-center justify-center flex-column"
    style="margin-bottom: 200px"
  >
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
  async mounted() {
    console.log(this.user, "this.user");
  },
  methods: {
    redirectToLogin() {
      window.location.href = "https://app.getspence.ai/login?autopilot=true";
    },
    redirectToJoin() {
      // alert("http://localhost:3000/get-started?autopilot=true");
      window.location.href = "http://localhost:3000/get-started?autopilot=true";
      //  "https://app.getspence.ai/get-started/?autopilot=true";
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
