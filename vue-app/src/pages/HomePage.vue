<template>
  <v-main class="home">
    <v-row class="welcome-section" align="center" justify="space-between">
      <v-col
        :class="{ 'pl-6': isMdAndUp, 'pa-0': !isMdAndUp }"
        :cols="isMdAndUp ? 8 : 12"
      >
        <v-row>
          <v-col v-if="isMdAndUp" cols="2" class="text-center">
            <img
              src="https://dt0651nvi2bbs.cloudfront.net/spence-face.png"
              alt="Spence"
              class="spence-image"
            />
          </v-col>
          <v-col
            :class="{
              'pt-5 pl-5': isMdAndUp,
              'pa-3 py-6 text-center': !isMdAndUp,
            }"
            sm="12"
            md="10"
          >
            <h1 class="welcome-text">Your Career, My Mission</h1>
            <div class="text-overline" style="color: #9e9e9e">
              Welcome to the Spence Autopilot
            </div>
          </v-col>
        </v-row>
      </v-col>
      <v-col
        :class="{ 'text-left pb-6': isMdAndUp, 'text-center py-6': !isMdAndUp }"
      >
        <v-btn
          color="rgb(90 255 206)"
          class="go-live-btn"
          to="/live"
          size="large"
          rounded="xl"
        >
          <v-icon left>mdi-play-circle</v-icon>
          Go Live
        </v-btn>
      </v-col>
    </v-row>
    <v-container v-if="user && user.existing_jobs.length > 0" class="ma-0 pa-0" style="margin-bottom: 100px !important;">
      <v-row>
        <v-col cols="12" md="6" :class="{ 'pa-6': isMdAndUp }">
          <BaseChart
            v-if="chartData.data && chartOptions"
            :colors="[
              'rgb(255 66 93 / 75%)', // Digital Pink
              'rgb(255 200 44 / 75%)', // Digital Orange
              'rgb(19 250 191 / 75%)', // Futuristic Teal
            ]"
            :data="chartData.data"
            :options="chartOptions"
            :stacked="true"
            chartType="column-chart"
            headline="Job Matches"
          />
        </v-col>
        <v-col cols="12" md="6" class="pa-6">
          <!-- Average Match Percentage with chart -->
          <BaseChart
            v-if="chartData.data2 && chartOptions2"
            :data="chartData.data2"
            :options="chartOptions2"
            :colors="['rgb(228, 170, 115)']"
            chartType="line-chart"
            headline="Average Match Percentage"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="6" class="px-6">
          <!-- list of top matches -->
          <JobsList headline="Top Matches" :jobs="topMatches" />
        </v-col>
        <v-col cols="12" md="6" class="px-6 fill-height">
          <SearchTermReport :jobs="user.existing_jobs" />
        </v-col>
      </v-row>
    </v-container>
    <v-row v-else>
      <v-col class="text-center" style="margin-top: 100px">
        <v-icon style="font-size: 100px; color: #5c5c5c">mdi-chart-line</v-icon>
        <h3 style="margin-top: 23px; color: #a8a8a8">
          Your stats will appear here once we start reviewing jobs.
        </h3>
      </v-col>
    </v-row>
  </v-main>
</template>

<script>
// import JobSiteWebView from "@/components/crawler/JobSiteWebView.vue";
// import BaseBarChart from "@/components/home/BaseBarChart.vue";

import "chartjs-adapter-date-fns";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

import * as shared from "@/helpers/shared.js";

import SearchTermReport from "@/components/home/SearchTermReport.vue";
import BaseChart from "@/components/home/BaseChart.vue";
import JobsList from "@/components/home/JobsList.vue";

import { computed } from "vue";
import { useDisplay } from "vuetify";

export default {
  name: "HomePage",
  components: {
    BaseChart,
    JobsList,
    SearchTermReport,
  },
  setup() {
    const display = useDisplay();
    const isMdAndUp = computed(() => display.mdAndUp.value);

    return {
      isMdAndUp,
    };
  },
  data() {
    return {
      shared: shared,
      job: {
        // job data
      },
      topMatches: [],
      newestMatches: [],
      chartData: {
        data: null,
        data2: null,
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              tooltipFormat: "MMM d", // Ensure the tooltip format is set
              displayFormats: {
                day: "MMM d", // Format the date labels to show month and day
              },
            },
            adapters: {
              date: {
                locale: enUS, // Pass the locale object here
              },
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10, // Adjust as needed to control the number of ticks
            },
          },
          y: {
            beginAtZero: true,
          },
        },
      },
      chartOptions2: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              tooltipFormat: "MMM d", // Ensure the tooltip format is set
              displayFormats: {
                day: "MMM d", // Format the date labels to show month and day
              },
            },
            adapters: {
              date: {
                locale: enUS, // Pass the locale object here
              },
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10, // Adjust as needed to control the number of ticks
            },
          },
          y: {
            min: 0, // This will be updated dynamically
            max: 100, // This will be updated dynamically
            ticks: {
              callback: function (value) {
                return value + "%";
              },
            },
          },
        },
      },
    };
  },
  mounted() {
    //   console.log("HomePage mounted");

    if (this.user) {
      this.chartData.data = this.chartDataTotalJobs();
      this.chartData.data2 = this.chartDataAveragePercentage();
      const percentages = this.chartData.data2.map(
        ([, percentage]) => percentage
      );
      this.chartOptions2.scales.y.min = Math.min(...percentages) - 5; // 5 is a buffer, adjust as needed
      this.chartOptions2.scales.y.max = Math.max(...percentages) + 5; // 5 is a buffer, adjust as needed

      this.topMatches = this.getTopMatches();
      // this.newestMatches = this.getNewestMatches();
    }

    //  console.log(this.chartData.data, "this.chartData.data");
  },
  methods: {
    getTopMatches() {
      // Assuming you have a method to get the top matches
      return this.user.existing_jobs
        .filter((job) => job.percentage !== null)
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 4); // Get top 5 matches
    },
    getNewestMatches() {
      // Assuming you have a method to get the top matches
      return this.user.existing_jobs
        .filter((job) => job.percentage !== null)
        .sort((a, b) => new Date(b.added) - new Date(a.added))
        .slice(0, 4); // Get top 5 matches
    },
    chartDataAveragePercentage() {
      const avgMatchPercentage = this.user.existing_jobs.reduce((acc, job) => {
        const day = format(new Date(job.added), "yyyy-MM-dd");

        // console.log(day, "day");
        // const day = new Date(job.added);
        if (job.percentage !== null) {
          if (!acc[day]) {
            acc[day] = { sum: 0, count: 0 };
          }

          acc[day].sum += parseFloat(job.percentage);
          acc[day].count++;
        }

        return acc;
      }, {});

      return Object.entries(avgMatchPercentage).map(([day, { sum, count }]) => [
        day,
        Math.round(sum / count),
      ]);
    },
    chartDataTotalJobs() {
      const groupedJobs = this.user.existing_jobs.reduce((acc, job) => {
        const day = format(new Date(job.added), "yyyy-MM-dd");
        const category = shared.lowMidHigh(job.percentage);

        if (!acc[day]) {
          acc[day] = { low: 0, mid: 0, high: 0 };
        }

        acc[day][category]++;

        return acc;
      }, {});

      return ["low", "mid", "high"].map((category) => ({
        name: category,
        data: Object.entries(groupedJobs).map(([day, counts]) => [
          day,
          counts[category],
        ]),
      }));
    },
  },
};
</script>

<style scoped>
.spence-image {
  width: 80px;
  height: 80px;
  border: 2px solid #fff1d8;
  border-radius: 50%;
}
.home {
  padding: 2px;
}
.test {
  color: rgba(141, 28, 141, 0.347);
}
.welcome-section {
  padding: 20px;
  padding-bottom: 0px;
  /* background-color: #2c2c2c;
  border-bottom: 1px solid #444; */
  display: flex;
  align-items: center; /* Center the content vertically */
}

.welcome-text {
  color: #fff; /* Adjust the text color as needed */
  font-size: 24px; /* Adjust the font size as needed */
  margin: 0;
}

.go-live-btn {
}

.go-live-btn .v-icon {
  margin-right: 8px; /* Adjust the icon margin as needed */
}
</style>
