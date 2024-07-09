<template>
  <div class="chart-container fill-height">
    <canvas id="searchTermChart"></canvas>
  </div>
</template>

<script>
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default {
  props: {
    reportData: Array,
  },
  mounted() {
    this.createChart();
  },
  methods: {
    createChart() {
      const ctx = document.getElementById("searchTermChart").getContext("2d");
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: this.reportData.map((item) => item.searchTerm),
          datasets: [
            {
              label: "Avg Match %",
              data: this.reportData.map((item) => item.avgPercentage),
              backgroundColor: "rgb(19 250 191 / 20%)",
              borderColor: "rgb(19 250 191 / 100%)",
              borderWidth: 1,
            },
            {
              label: "Number of Jobs",
              data: this.reportData.map((item) => item.count),
              backgroundColor: "rgb(255 200 44 / 20%)",
              borderColor: "rgb(255 200 44)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          maintainAspectRatio: false, // Allow the chart to adjust its aspect ratio
          responsive: true, // Make the chart responsive
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    },
  },
};
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  min-height: 300px; /* Set your desired minimum height */
  max-height: 500px; /* Set a maximum height to prevent stretching */
}
#searchTermChart {
  width: 100%;
  height: 100%;
}
</style>