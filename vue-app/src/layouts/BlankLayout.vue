<template>
  <v-container
    class="fill-height ma-0 pa-0 w-100"
    style="
      background: linear-gradient(135deg, #1a202c 0%, #4dc2a5 100%);
      min-width: 100%;
    "
  >
    <router-view class="scrollable"></router-view>
  </v-container>
</template>


<script>
export default {
  data() {
    return {
      //  user2: null,
    };
  },
  created() {
    this.$store.dispatch("loadUser");

    this.$store.watch(
      function (state) {
        return state.user;
      },
      (value) => {
        console.log(value, " setting this.user");
        //   this.user2 = value;
      },
      {
        deep: true, //add this if u need to watch object properties change etc.
      }
    );
  },
};
</script>

<style scoped>
.scrollable {
  overflow-y: auto;
  height: calc(100vh - 64px);
}
</style>
