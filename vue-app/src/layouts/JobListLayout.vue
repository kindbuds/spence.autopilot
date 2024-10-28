<template>
  <MainLayout>
    <template v-slot:default>
      <div class="job-list-layout">
        <div
          class="job-site-web-view-container"
          v-show="!(selectedJob && !isMdAndUp)"
        >
          <slot></slot>
          <!-- This will render the job-site-web-view -->
        </div>
        <div
          class="selected-job-container"
          :class="{ mobile: !isMdAndUp }"
          v-if="selectedJob"
        >
          <!-- <div>
            <h2>{{ selectedJob.title }}</h2>
            <p>{{ selectedJob.description }}</p>
          </div> -->
          <IndividualJobWebView
            v-if="!auth"
            :url="selectedJob.url"
            :job="selectedJob"
            @jobDetailClosed="onJobDetailClosed"
            @authRequired="onAuthRequired"
          />
          <login-helper
            v-else
            :url="urls.login"
            domainFriendly="LinkedIn"
            domain="https://www.linkedin.com/"
            @loginSuccess="onLoginSuccess"
          ></login-helper>
          <!-- This will render the selectedJob details -->
        </div>
      </div>
    </template>
  </MainLayout>
</template>

<script>
import { useDisplay } from "vuetify";
import { computed } from "vue";
import MainLayout from "@/layouts/MainLayout.vue";
import IndividualJobWebView from "@/components/crawler/IndividualJobWebView.vue";
import LoginHelper from "@/components/crawler/LoginHelper.vue";

import * as shared from "@/helpers/shared.js";
export default {
  components: {
    MainLayout,
    IndividualJobWebView,
    LoginHelper,
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
      auth: false,
      urls: {
        search: null,
        login: "https://www.linkedin.com/login",
      },
      selectedJob: null,
    };
  },
  emits: ["jobDetailClosed"],
  methods: {
    async onLoginSuccess() {
      // ("onLoginSuccess");
      // this.auth = false;
      setTimeout(() => {
        this.auth = false;
      }, 1500);
      // await shared.delay(10000);
    },
    onAuthRequired() {
      //    console.log("onAuthRequired");
      // alert("onAuthRequired");
      // this.$nextTick(() => {
      //   this.auth = true;
      // });
      setTimeout(() => {
        // alert(`skipped  this.auth = true;`);
        this.auth = true;
      }, 1500);
    },
    onJobDetailClosed() {
      this.selectedJob = null;
      this.$emit("jobDetailClosed");
    },
    displayJob(job) {
      //  console.log("JobListLayout.displayJob called with:", job);
      this.selectedJob = this.selectedJob != job ? job : null;
      //   console.log("JobListLayout.selectedJob updated to:", this.selectedJob);
    },
  },

  async mounted() {
    await shared.sendGA4ScreenView(this);
  },
};
</script>

<style scoped>
.job-list-layout {
  display: flex;
  flex-direction: row;
  height: 100%;
  background-color: #121212b6;
}

.job-site-web-view-container {
  flex: 1;
}

.selected-job-container {
  flex: 0 0 50vw; /* Adjust the width as needed */
  padding: 0px;
  border-left: 1px solid #5d5d5d; /* Optional: Add a border to separate the columns */
}

.selected-job-container.mobile {
  flex: 0 0 100vw;
}
</style>
