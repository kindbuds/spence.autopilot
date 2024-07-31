<template>
  <v-card elevation="0" v-if="data && options" density="compact">
    <v-card-title class="mb-2">
      <span class="text-overline text-grey">{{ headline }}</span>
    </v-card-title>
    <v-card-text>
      <component
        :is="chartType"
        :data="data"
        :stacked="stacked"
        :colors="colors"
        :library="options"
      ></component>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      required: true,
    },
    options: {
      type: Object,
      required: true,
    },
    headline: {
      type: String,
      required: true,
    },
    stacked: {
      type: Boolean,
      default: false,
    },
    colors: {
      type: Array,
      default: () => ["darkorange"],
    },
    chartType: {
      type: String,
      required: true,
    },
  },
  mounted() {
    //    console.log(this.data, "this.data");
    //   console.log(this.options, "this.options");
  },
};
</script>

<style scoped>
</style>
