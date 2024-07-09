<template>
  <v-col cols="12" class="chart-wrapper fill-height">
    <v-card elevation="0" v-if="jobs && jobs.length > 0" density="compact">
      <v-card-title class="mb-2">
        <span class="text-overline text-grey">Top Searches</span></v-card-title
      >
      <v-card-text>
        <SearchTermChart :reportData="reportData" />
      </v-card-text>
    </v-card>
  </v-col>
</template>

<script>
import SearchTermChart from "./SearchTermChart.vue";

export default {
  components: {
    SearchTermChart,
  },
  props: {
    jobs: Array,
  },
  computed: {
    reportData() {
      const searchTerms = {};
      this.jobs.forEach((job) => {
        if (job.search && job.percentage !== null && job.percentage) {
          if (!searchTerms[job.search]) {
            searchTerms[job.search] = { sum: 0, count: 0 };
          }
          searchTerms[job.search].sum += parseFloat(job.percentage);
          searchTerms[job.search].count++;
        }
      });
      const results = Object.keys(searchTerms).map((key) => ({
        searchTerm: key,
        avgPercentage: (searchTerms[key].sum / searchTerms[key].count).toFixed(
          0
        ),
        count: searchTerms[key].count,
      }));
      return results
        .sort(
          (a, b) => parseFloat(b.avgPercentage) - parseFloat(a.avgPercentage)
        )
        .slice(0, 5); // Only take the top 5
    },
  },
};
</script>

<style scoped>
.chart-wrapper {
  height: 100%;
}
</style>