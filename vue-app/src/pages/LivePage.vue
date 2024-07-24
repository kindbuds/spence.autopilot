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
            v-if="user"
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
    user(newVal) {
      this.urls.search = `https://www.linkedin.com/jobs/search/?${this.translateLocation()}&sortBy=DD${this.translateSalary()}&f_E=${this.translateExperience()}`;
      console.log(this.urls.search, "this.urls.search");

      console.log(newVal, "watch.user");
      // alert("watch.user");
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
    translateLocation() {
      if (!this.user) return;

      console.log(this.user, "translateLocation");

      if (this.user.userid === "0dfad5ac-72ca-4271-aad3-17e2c8b20347") {
        // jeff chiarelli
        // alert("chia1");
        let retval = `f_WT=1,3`;

        if (this.user.autopilot.location) {
          retval += `&location=${this.user.autopilot.location}`;
        }
        return retval;
      }

      if (!this.user.autopilot.location) return "f_WT=2";

      return `f_WT=1,3,2&location=${this.user.autopilot.location}`;
    },
    translateSalary() {
      if (!this.user) return;

      if (this.user.userid === "0dfad5ac-72ca-4271-aad3-17e2c8b20347") {
        // jeff chiarelli
        // alert("chia2");
        return "";
      }

      let salaryLevel;
      if (this.user.autopilot.salary <= 40000) salaryLevel = 1;
      else if (this.user.autopilot.salary <= 60000) salaryLevel = 2;
      else if (this.user.autopilot.salary <= 80000) salaryLevel = 3;
      else if (this.user.autopilot.salary <= 100000) salaryLevel = 4;
      else if (this.user.autopilot.salary <= 120000) salaryLevel = 5;
      else if (this.user.autopilot.salary <= 140000) salaryLevel = 6;
      else if (this.user.autopilot.salary <= 160000) salaryLevel = 7;
      else if (this.user.autopilot.salary <= 180000) salaryLevel = 8;
      else if (this.user.autopilot.salary <= 200000) salaryLevel = 9;
      else salaryLevel = 10;

      return `&f_SB2=${salaryLevel}`;
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

