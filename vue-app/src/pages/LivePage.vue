<template>
  <div>
    <JobListLayout
      v-if="!auth"
      ref="jobListLayout"
      @jobDetailClosed="handleJobDetailClosed"
    >
      <template v-slot:default>
        <v-main class="pa-0">
          <job-site-web-view
            :url="urls.search"
            :selectedJob="selectedJob"
            @authRequired="onAuthRequired"
            @jobSelected="onJobSelected"
          ></job-site-web-view>
        </v-main>
      </template>
    </JobListLayout>
    <MainLayout v-else>
      <template v-slot:default>
        <v-main class="pa-0">
          <login-helper
            :url="urls.login"
            domainFriendly="LinkedIn"
            domain="https://www.linkedin.com/"
            @loginSuccess="onLoginSuccess"
          ></login-helper>
        </v-main>
      </template>
    </MainLayout>
  </div>
</template>

<script>
// import * as shared from "@/helpers/shared.js";
import JobListLayout from "@/layouts/JobListLayout.vue";
import MainLayout from "@/layouts/MainLayout.vue";
import JobSiteWebView from "@/components/crawler/JobSiteWebView.vue";
import LoginHelper from "@/components/crawler/LoginHelper.vue";
export default {
  name: "LivePage",
  // layout: "JobListLayout",
  components: {
    MainLayout,
    JobListLayout,
    JobSiteWebView,
    LoginHelper,
  },
  emits: ["displayJob"],
  data() {
    return {
      auth: false,
      urls: {
        search: null,
        login: "https://www.linkedin.com/login",
      },
      experience_levels: [{}],
      selectedJob: null,
    };
  },
  mounted() {
    if (window.electron) {
      window.electron.onJobDetails((jobDetails) => {
        console.log("Job details received in Vue:", jobDetails);
        // Handle the job details, e.g., store them in Vue data/component state
      });
    }

    // testing week for paging
    // this.urls.search = `https://www.linkedin.com/jobs/search/?f_TPR=r604800&f_WT=2&sortBy=DD&f_SB2=${this.translateSalary()}&f_E=${this.translateExperience()}`;

    // production below
    this.urls.search = `https://www.linkedin.com/jobs/search/?f_TPR=r86400&f_WT=2&sortBy=DD&f_SB2=${this.translateSalary()}&f_E=${this.translateExperience()}`;
    console.log(this.urls.search, "this.urls.search");
  },
  beforeUnmount() {
    if (window.electron) {
      // Assuming ipcRenderer.removeAllListeners is exposed or handled differently
      window.electron.onJobDetails(() => {}); // Clear the listener
    }
  },
  watch: {
    selectedJob(newVal, oldVal) {
      console.log("selectedJob changed from", oldVal, "to", newVal);
      this.updateColumns();
    },
  },
  methods: {
    handleJobDetailClosed() {
      // alert("LivePage.handleJobDetailClosed");
      this.selectedJob = null;
    },
    updateColumns() {
      // Force a re-render to update the columns
      this.$forceUpdate();
    },
    onJobSelected(job) {
      // alert("LivePage.onJobSelected");
      console.log(job, "LivePage.onJobSelected");
      this.$refs.jobListLayout.displayJob(job);
      this.selectedJob = job;
    },
    translateSalary() {
      if (!this.user) return;

      if (this.user.autopilot.salary <= 40000) return 1;
      else if (this.user.autopilot.salary <= 60000) return 2;
      else if (this.user.autopilot.salary <= 80000) return 3;
      else if (this.user.autopilot.salary <= 100000) return 4;
      else if (this.user.autopilot.salary <= 120000) return 5;
      else if (this.user.autopilot.salary <= 140000) return 6;
      else if (this.user.autopilot.salary <= 160000) return 7;
      else if (this.user.autopilot.salary <= 180000) return 8;
      else if (this.user.autopilot.salary <= 200000) return 9;
      else return 10;
    },
    translateExperience() {
      if (!this.user) return;
      const experienceMapping = {
        Internship: 1,
        Entry: 2,
        Associate: 3,
        "Mid-Senior": 4,
        Director: 5,
        Executive: 6,
      };

      const experienceLevels = this.user.autopilot.experience_levels
        .map((level) => experienceMapping[level])
        .filter((level) => level !== undefined); // Ensure valid levels

      return encodeURIComponent(experienceLevels.join(","));
    },
    async onLoginSuccess() {
      console.log("onLoginSuccess");
      // this.auth = false;
      setTimeout(() => {
        this.auth = false;
      }, 1500);
      // await shared.delay(10000);
    },
    onAuthRequired() {
      console.log("onAuthRequired");
      // alert("onAuthRequired");
      // this.$nextTick(() => {
      //   this.auth = true;
      // });
      setTimeout(() => {
        // alert(`skipped  this.auth = true;`);
        this.auth = true;
      }, 1500);
    },
  },
};
</script>

