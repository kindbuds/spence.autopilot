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
import auth0 from "auth0-js";
export default {
  name: "LogoutPage",
  components: {},
  data() {
    return {
      amplifyDomain: window.electron.AMPLIFY_DOMAIN,
      spenceDomain: window.electron.SPENCE_DOMAIN,
    };
  },
  async mounted() {
    const redir = `${this.spenceDomain}logout-cleanup/`;
    // alert(`redir: ${redir}`);
    const webAuth = new auth0.WebAuth({
      domain: "dev-5u51zijdqldlv4t4.us.auth0.com",
      clientID: "To3yLHtfQHI6G8e4SVYXYdnB9IBddQIr",
      redirectUri: redir,
      responseType: "token id_token",
      scope: "email",
    });
    webAuth.logout({
      returnTo: redir,
      clientID: "To3yLHtfQHI6G8e4SVYXYdnB9IBddQIr",
    });
    await window.electron.logout();
  },
};
</script>

<style scoped>
.logout {
  padding: 20px;
}
</style>
