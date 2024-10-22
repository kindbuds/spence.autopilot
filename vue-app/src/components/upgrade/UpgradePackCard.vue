<template>
  <v-col cols="12" sm="6" md="6">
    <v-card
      class="pa-4 stripe-card"
      elevation="16"
      variant="outlined"
      color="white"
    >
      <v-card-title class="text-h5">
        <v-icon
          size="x-small"
          icon="mdi-arrow-up-bold"
          color="rgb(124 124 124)"
          class="mb-1"
          style="font-size: 30px !important"
        ></v-icon>
        {{ pack.name }}</v-card-title
      >

      <v-card-text class="pt-3 ml-3 text-body-1" style="line-height: 3">
        <p><strong>Additional Job Matches:</strong> {{ pack.jobMatches }}</p>
      </v-card-text>
      <v-card-subtitle class="text-subtitle-1 ml-3"
        >${{ pack.price }} one-time</v-card-subtitle
      >
      <v-card-actions>
        <v-btn
          rounded
          color="teal-accent-2"
          variant="elevated"
          size="large"
          @click="$emit('purchase', pack)"
          class="mx-auto"
          >Buy Now</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-col>
</template>

<script>
export default {
  name: "UpgradePackCard",
  props: {
    pack: Object,
  },
};
</script>

<style scoped>
/* Add your styles here */
</style>
