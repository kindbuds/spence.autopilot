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
          icon="mdi-shield-check-outline"
          color="rgb(124 124 124)"
          class="mb-1 mr-1"
        ></v-icon>
        {{ plan.name }}</v-card-title
      >
      <v-card-text class="pt-3 ml-3 text-body-1" style="line-height: 3">
        <p><strong>Job Matches per Day:</strong> {{ plan.jobMatches }}</p>
        <p>
          <strong>Job Matches per Month:</strong> {{ plan.jobMatches * 30 }}
        </p>
        <ul>
          <li v-for="(feature, index) in plan.features" :key="index">
            {{ feature }}
          </li>
        </ul>
      </v-card-text>
      <v-card-subtitle class="text-subtitle-1 py-3 ml-3">
        ${{ plan.price }} / {{ plan.billingCycle }}
      </v-card-subtitle>

      <v-card-actions class="text-right">
        <v-btn
          rounded
          color="teal-accent-2"
          size="large"
          variant="elevated"
          @click="$emit('upgrade', plan)"
          class="mx-auto"
          >Subscribe</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-col>
</template>

<script>
export default {
  name: "PlanCard",
  props: {
    plan: Object,
  },
};
</script>

<style scoped>
/* Add your styles here */
</style>
