<template>
  <div>
    <JobListLayout ref="jobListLayout" @jobDetailClosed="handleJobDetailClosed">
      <template v-slot:default>
        <v-row v-if="individualJob" no-gutters class="ma-2" align="center">
          <v-col class="ma-0 pa-2 pb-0" cols="12">
            <v-btn
              variant="tonal"
              color="orange-accent-2"
              size="small"
              @click="clearIndividualJob"
            >
              <v-icon class="mr-2">mdi-filter</v-icon>
              <span
                style="
                  color: white;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  width: 200px; /* Adjust this value as needed */
                  display: inline-block; /* This is needed for width to take effect */
                "
              >
                jobid: {{ individualJob.guid }}
              </span>
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-row v-else no-gutters class="ma-2" align="center">
          <v-col class="ma-0 pa-1" cols="10" md="6">
            <v-text-field
              v-model="searchQuery"
              @input="debouncedFilterJobs"
              label="Search Jobs"
              variant="outlined"
              dense
              clearable
              :hide-details="true"
              autofocus
            ></v-text-field>
          </v-col>
          <v-col v-if="!isMdAndUp" class="ma-0 pa-1 text-center" cols="2">
            <v-btn icon @click="toggleFilters">
              <v-icon color="grey">mdi-sort-bool-ascending-variant</v-icon>
            </v-btn>
          </v-col>
          <v-col v-if="isMdAndUp" class="ma-0 pa-1" cols="12" md="5">
            <v-row no-gutters align="center">
              <v-col class="ma-0 pa-1" cols="4">
                <v-select
                  v-model="sortCriteria"
                  :items="sortOptions"
                  variant="outlined"
                  itemTitle="text"
                  itemValue="value"
                  label="Sort By"
                  dense
                  :hide-details="true"
                ></v-select>
              </v-col>
              <v-col class="ma-0 pa-1" cols="4">
                <v-select
                  v-model="dateFilter"
                  :items="dateFilterOptions"
                  variant="outlined"
                  itemTitle="text"
                  itemValue="value"
                  label="Date Filter"
                  dense
                  :hide-details="true"
                ></v-select>
              </v-col>
              <v-col class="ma-0 pa-1" cols="4">
                <v-select
                  v-model="statusFilter"
                  :items="statusFilterOptions"
                  variant="outlined"
                  itemTitle="text"
                  itemValue="value"
                  label="Status Filter"
                  dense
                  :hide-details="true"
                ></v-select>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <v-row
          v-if="!isMdAndUp && showFilters"
          no-gutters
          class="ma-2"
          align="center"
        >
          <v-col class="ma-0 pa-1" cols="4">
            <v-select
              v-model="sortCriteria"
              :items="sortOptions"
              variant="outlined"
              itemTitle="text"
              itemValue="value"
              label="Sort By"
              dense
              :hide-details="true"
            ></v-select>
          </v-col>
          <v-col class="ma-0 pa-1" cols="4">
            <v-select
              v-model="dateFilter"
              :items="dateFilterOptions"
              variant="outlined"
              itemTitle="text"
              itemValue="value"
              label="Date Filter"
              dense
              :hide-details="true"
            ></v-select>
          </v-col>
          <v-col class="ma-0 pa-1" cols="4">
            <v-select
              v-model="statusFilter"
              :items="statusFilterOptions"
              variant="outlined"
              itemTitle="text"
              itemValue="value"
              label="Status Filter"
              dense
              :hide-details="true"
            ></v-select>
          </v-col>
        </v-row>
        <div
          class="job-master"
          v-if="filteredJobs"
          :class="{ skinny: selectedJob != null }"
        >
          <v-container
            id="jobs-list"
            fluid
            style="overflow-y: auto; padding-bottom: 70px"
            ref="jobContainer"
            :class="{ mobile: !isMdAndUp }"
          >
            <v-row ref="jobRow" class="job-row" no-gutters>
              <JobCard
                v-for="job in visibleJobs"
                :key="job.id"
                context="jobs"
                :job="job"
                :ref="'job-' + job.id"
                :selectedJob="selectedJob"
                :getJobStatusClass="getJobStatusClass"
                @jobSelected="emitJob"
                @jobVoted="onJobVoted"
                @jobSaved="onJobSaved"
                @newCompanyFilter="onNewCompanyFilter"
              />

              <div ref="sentinel" class="sentinel"></div>
            </v-row>
          </v-container>
        </div>
      </template>
    </JobListLayout>
  </div>
</template>

<script>
import { debounce } from "lodash";
import JobCard from "@/components/crawler/JobCard.vue";
import JobListLayout from "@/layouts/JobListLayout.vue";
// eslint-disable-next-line no-unused-vars
import * as shared from "@/helpers/shared.js";
import { useDisplay } from "vuetify";
import { computed } from "vue";

export default {
  name: "JobsPage",
  components: { JobListLayout, JobCard },
  emits: ["jobSelected"],
  setup() {
    const display = useDisplay();
    const isMdAndUp = computed(() => display.mdAndUp.value);

    return {
      isMdAndUp,
    };
  },
  data() {
    return {
      companyFilters: [],

      individualJob: null,
      visibleJobs: [],
      pageSize: window.innerWidth <= 768 ? 30 : 66, // Adjust these values as needed

      searchQuery: "",
      jobs: [],
      user2: null,
      selectedJob: null,
      getJobStatusClass: shared.getJobStatusClass,
      sortCriteria: "percentage",
      dateFilter: "all",
      statusFilter: "all",
      sortOptions: [
        { text: "Percentage", value: "percentage" },
        { text: "Added", value: "added" },
      ],
      dateFilterOptions: [
        { text: "All Time", value: "all" },
        { text: "Last 24 Hours", value: "24h" },
        { text: "Last 3 Days", value: "3d" },
        { text: "Last 7 Days", value: "7d" },
        { text: "Last 14 Days", value: "14d" },
        { text: "Last 30 Days", value: "30d" },
      ],
      statusFilterOptions: [
        { text: "All", value: "all" },
        { text: "Saved", value: "upvoted" },
      ],
      filteredJobs: [],
      showFilters: false,
    };
  },
  async mounted() {
    setTimeout(() => {
      const options = {
        root: null,
        rootMargin: "0px",
        threshold: 1.0,
      };

      try {
        const observer = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            // console.log("Intersection Observer Entry:", entry); // Log the entry
            if (entry.isIntersecting) {
              // console.log("Sentinel is intersecting. Loading more jobs...");
              this.loadMoreJobs();
              if (this.visibleJobs.length >= this.filteredJobs.length) {
                // console.log(
                //   "All jobs have been loaded. Disconnecting observer..."
                // );
                observer.disconnect(); // Disconnect the observer when all jobs have been loaded
              }
            }
          });
        }, options);

        // console.log("Sentinel:", this.$refs.sentinel); // Log the sentinel
        observer.observe(this.$refs.sentinel);
      } catch (err) {
        //   console.log("observer failed");
      }
      if (this.individualJob) this.emitJob(this.individualJob);
    }, 2000);
  },
  created() {
    this.$store.watch(
      function (state) {
        return state.user;
      },
      (value) => {
        // console.log(value, " setting this.user 2222");
        this.user2 = value;
        this.jobs = this.user2.existing_jobs
          .filter((f) => f.success)
          .sort((a, b) => {
            const aPercentage = a.percentage ? parseInt(a.percentage) : 0;
            const bPercentage = b.percentage ? parseInt(b.percentage) : 0;
            return bPercentage - aPercentage;
          });
        this.filterJobs();
        this.companyFilters = this.user2.autopilot.company_filters;
      },
      {
        deep: true, //add this if u need to watch object properties change etc.
      }
    );
  },
  watch: {
    searchQuery() {
      this.debouncedFilterJobs();
    },
    sortCriteria() {
      this.filterJobs();
    },
    dateFilter() {
      this.filterJobs();
    },
    statusFilter() {
      this.filterJobs();
    },
  },
  methods: {
    onNewCompanyFilter(payload) {
      this.companyFilters.push(shared.transformCompanyFilter(payload));
    },
    toggleFilters() {
      this.showFilters = !this.showFilters;
    },
    clearIndividualJob() {
      //  console.log("clearIndividualJob");
      this.individualJob = null;
      this.$router.push({ query: { ...this.$route.query, show: null } });

      setTimeout(() => {
        this.filterJobs();
      }, 500);
    },
    loadMoreJobs() {
      if (this.visibleJobs.length < this.filteredJobs.length) {
        const nextJobs = this.filteredJobs.slice(
          this.visibleJobs.length,
          this.visibleJobs.length + this.pageSize
        );
        this.visibleJobs = [...this.visibleJobs, ...nextJobs];
      }
    },
    filterJobs() {
      if (!this.jobs || this.jobs.length === 0) return;
      //   console.log(this.jobs, this.jobs.length, "this.jobs.length");
      const query = this.searchQuery ? this.searchQuery.toLowerCase() : "";
      const now = new Date();
      this.individualJob = null;
      let filtered;
      if (this.$route.query.show) {
        const guid = this.$route.query.show;
        filtered = this.jobs.filter((job) => job.guid === guid);
        if (filtered.length === 0) return;
        //     console.log(filtered, "filtered");
        this.individualJob = filtered[0];
      } else {
        filtered = this.jobs.filter((job) => {
          const employer = job.employer || job.employer_name || "";
          return (
            employer.toLowerCase().includes(query) ||
            job.title.toLowerCase().includes(query)
          );
        });
      }

      if (this.dateFilter !== "all") {
        const dateRanges = {
          "24h": 1,
          "3d": 3,
          "7d": 7,
          "14d": 14,
          "30d": 30,
        };
        const days = dateRanges[this.dateFilter];
        const cutoffDate = new Date(now.setDate(now.getDate() - days));
        filtered = filtered.filter((job) => new Date(job.added) >= cutoffDate);
      }

      if (this.statusFilter === "upvoted") {
        filtered = filtered.filter((job) => job.vote === true);
      } else if (this.statusFilter === "saved") {
        filtered = filtered.filter((job) => job.saved != null);
      }

      if (this.sortCriteria === "percentage") {
        filtered = filtered.sort((a, b) => b.percentage - a.percentage);
      } else if (this.sortCriteria === "added") {
        filtered = filtered.sort(
          (a, b) => new Date(b.added) - new Date(a.added)
        );
      }

      //   console.log(filtered, filtered.length, "filtered");
      this.filteredJobs = filtered;
      this.visibleJobs = this.filteredJobs.slice(0, this.pageSize); // Reset visibleJobs
    },

    debouncedFilterJobs: debounce(function () {
      this.filterJobs();
    }, 600),
    handleJobDetailClosed() {
      this.selectedJob = null;
    },
    emitJob(job) {
      if (job === this.selectedJob) job = null;

      this.$refs.jobListLayout.displayJob(job);
      this.selectedJob = job;
      //   console.log(job, "JobsPage.emitJob");
      this.$emit("jobSelected", job);

      this.$nextTick(() => {
        if (job) {
          const jobRef = this.$refs["job-" + job.id];
          if (!jobRef[0]) return;
          //   console.log(jobRef, "jobRef");
          //    console.log(jobRef[0], "jobRef[0]");
          if (jobRef && jobRef[0]) {
            const jobElement = jobRef[0].$el;
            const container = this.$refs.jobContainer.$el;
            //    console.log(container, "container");
            //     console.log(jobElement, "jobElement");

            if (jobElement && container) {
              const containerRect = container.getBoundingClientRect();
              const jobElementRect = jobElement.getBoundingClientRect();
              const offset = jobElementRect.top - containerRect.top;

              // Adjust the scroll position to scroll near the top with smooth behavior
              container.scrollTo({
                top: container.scrollTop + offset - 10, // Adjust the 20px as needed
                behavior: "smooth",
              });
            }
          }
        }
      });
    },

    onJobVoted(voteData) {
      // console.log(voteData, "onJobVoted");
      const jobIndex = this.jobs.findIndex((job) => job.id === voteData.jobId);
      if (jobIndex !== -1) {
        this.jobs[jobIndex] = {
          ...this.jobs[jobIndex],
          vote: voteData.vote,
          vote_feedback: voteData.feedback,
        };
      }
    },

    onJobSaved(saveData) {
      console.log(saveData, "onJobSaved");
    },
  },
};
</script>

<style scoped>
#jobs-list.mobile {
  padding: 0px;
  width: 100vw;
}
.empty-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #ffffff;
  padding: 20px;
  margin-top: 100px;
}

.empty-state-icon {
  font-size: 230px;
  color: #333333;
  margin-bottom: 20px;
  margin-top: 20px;
}

.empty-state-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.empty-state-instruction {
  font-size: 18px;
  color: #afafaf;
}
.job-master.skinny #jobs-list {
  padding: 0px;
  padding-top: 20px;
}
.job-master.skinny {
  width: 35vw;
}
.job-master {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
}
.go-live {
  text-decoration: none;
  color: #00ffc6;
  background-color: #264d45;
  padding: 1px;
  padding-left: 4px;
  border-radius: 5px;
  padding-right: 4px;
}
</style>
