<template>
  <v-col
    :cols="selectedJob ? 12 : 12"
    :sm="selectedJob ? 12 : 6"
    :md="selectedJob ? 12 : 6"
    :lg="selectedJob ? 12 : 4"
    class="job-col"
  >
    <v-card
      class="job-card ma-4 pa-1 card-div"
      :class="[getJobStatusClass(job), { selected: isSelected }]"
    >
      <v-card-title class="title-div">
        <a
          :href="job.url"
          target="_blank"
          class="title-link"
          @click.prevent="emitJob(job)"
        >
          {{ job.title }}
        </a>
      </v-card-title>
      <v-card-text class="pb-2 pr-2">
        <div class="employer-container">
          <img
            src="https://dt0651nvi2bbs.cloudfront.net/linkedin-icon.png"
            class="linkedin-icon"
          />
          <div class="employer-div">
            {{ job.employer ? job.employer : job.employer_name }}
          </div>
        </div>
        <v-row
          v-if="!job.percentage && !job.nopercent"
          class="status-div"
          no-gutters
        >
          <v-col class="pb-1"> {{ job.status }}</v-col>
        </v-row>
        <v-row no-gutters v-else>
          <v-col
            v-if="job.percentage"
            cols="1"
            class="ma-0 pa-0 pt-3 percentage-div match-percent"
            style="min-width: 50px"
          >
            <span v-if="job.percentage">
              {{ formatPercentage(job.percentage) }}%</span
            ></v-col
          >
          <v-col class="pt-3 text-caption search-display">
            {{
              context === "live"
                ? job.search
                : new Date(job.added).toLocaleDateString("en-US")
            }}
          </v-col>
          <v-col class="ma-0 pa-0 text-right" style="white-space: nowrap">
            <JobVote :job="job" @jobVoted="onJobVoted" />
            <!-- <JobSave :job="job" @jobSaved="onJobSaved" /> -->
            <JobOptions :job="job" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-col>
</template>

<script>
import JobVote from "@/components/crawler/JobVote.vue";
import JobOptions from "@/components/crawler/JobOptions.vue";
// import JobSave from "@/components/crawler/JobSave.vue"; JobSave,

export default {
  props: {
    job: Object,
    selectedJob: Object,
    getJobStatusClass: Function,
    context: String,
  },
  components: {
    JobVote,
    JobOptions,
  },
  computed: {
    isSelected() {
      return this.job === this.selectedJob;
    },
  },
  methods: {
    formatPercentage(percentage) {
      if (!percentage) return;

      return parseInt(percentage).toFixed(2).replace(/\.00$/, "");
    },
    emitJob(job) {
      this.$emit("jobSelected", job);
    },
    onJobVoted(voteData) {
      this.$emit("jobVoted", voteData);
    },
    onJobSaved(saveData) {
      this.$emit("jobSaved", saveData);
    },
  },
};
</script>

<style scoped>
.job-card {
  margin-top: 0 !important; /* Ensures no space between stacked cards */
}
.job-col {
  display: flex;
  flex-direction: column;
  padding-top: 0 !important;
  margin-top: 0 !important; /* Ensure no vertical spacing between cards */
  margin-bottom: 0px; /* Adjust this if you need some spacing between cards */
}
.job-card.selected {
  border: 3px solid #fffffff5;
}
</style>
