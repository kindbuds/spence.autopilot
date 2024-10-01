<template>
  <v-container
    class="fill-height ma-0 pa-0 w-100 blank-container"
    style="min-width: 100%"
  >
    <router-view class="router-view"></router-view>
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
.router-view {
  /* overflow-y: auto; */
  height: calc(100vh - 64px);
}
</style>
