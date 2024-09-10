<template>
  <div class="job-master">
    <webview
      v-if="preload"
      :preload="preload"
      id="linkedin-webview"
      ref="linkedinWebView"
      class="webview"
      :src="testPageUrl"
      useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0"
      @dom-ready="onDomReady"
      @will-navigate="onWillNavigate"
      @did-navigate="onDidNavigate"
      :webpreferences="'nodeIntegration=yes'"
      :style="{
        height: !can_generate_percents ? '83vh' : '87vh',
        'min-height': !can_generate_percents ? '80vh' : '88vh',
        width: !isMdAndUp ? '100vw' : '100%',
        opacity: webviewOpacity === 1 || hideOverlay ? 1 : 0,
      }"
    ></webview>

    <v-container
      v-if="!hideOverlay"
      class="overlay-container"
      :class="[
        isMdAndUp ? 'pb-0 pt-3' : 'pa-2 pb-0',
        { 'limit-warn': !can_generate_percents },
      ]"
      :style="{ opacity: webviewOpacity === 1 ? 0.7 : 1 }"
      fluid
    >
      <v-row
        v-if="jobs.length > 0"
        ref="jobRow"
        :class="['job-row', { 'reverse-column': !isMdAndUp }]"
        no-gutters
      >
        <JobCard
          v-for="job in jobs"
          :key="job.id"
          context="live"
          :job="job"
          :ref="'job-' + job.id"
          :selectedJob="selectedJob"
          :getJobStatusClass="getJobStatusClass"
          @jobSelected="emitJob"
          @jobVoted="onJobVoted"
          @jobSaved="onJobSaved"
          @newCompanyFilter="onNewCompanyFilter"
        />
      </v-row>
      <v-container v-else-if="initialized" class="fill-height" fluid>
        <v-row class="fill-height" align="center" justify="center">
          <v-col class="text-center">
            <v-progress-circular
              indeterminate
              :size="70"
              :width="7"
              color="grey-darken-4"
            ></v-progress-circular>
            <h2 class="loading-message text-grey-darken-1">
              Finding your perfect job matches
              <div class="text-h6" style="color: #555555; padding: 10px">
                It may take a few moments for jobs to appear
              </div>
            </h2>
          </v-col>
        </v-row>
      </v-container>
      <v-container v-else class="fill-height" fluid>
        <v-row class="fill-height" align="center" justify="center">
          <v-col class="text-center">
            <v-progress-circular
              indeterminate
              :size="70"
              :width="7"
              color="grey"
            ></v-progress-circular>
          </v-col>
        </v-row>
      </v-container>
    </v-container>

    <v-alert
      v-if="!can_generate_percents"
      style="border-radius: 0px; display: flex; align-items: center"
      border="start"
      border-color="rgb(255 234 135)"
      color="#2d2d2d"
    >
      <v-row no-gutters>
        <v-col
          class="pt-2"
          cols="11"
          style="
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          "
        >
          We've reached your daily job review limit.
        </v-col>
        <v-col cols="1">
          <v-btn color="transparent" elevation="0" icon size="small">
            <v-icon color="rgb(190 182 145)"> mdi-information </v-icon>
            <v-tooltip
              max-width="200px"
              opacity="1"
              activator="parent"
              location="top"
            >
              <div class="tooltip-text">
                We'll continue searching for jobs and posting them here - but
                they will not include your match percentage.
              </div></v-tooltip
            >
          </v-btn>
        </v-col>
      </v-row>
    </v-alert>
    <h3 v-if="this.user_loaded" class="h2-controls px-3">
      <v-btn
        icon="mdi-close"
        elevation="0"
        :color="hideOverlay ? 'orange' : 'transparent'"
        size="x-small"
        class="mb-1 mr-1 float-right"
        @click="toggleHideOverlay"
      ></v-btn>
      <v-btn
        :loading="!initialized"
        :icon="sleeping ? 'mdi-sleep' : !isPaused ? 'mdi-pause' : 'mdi-play'"
        :color="
          sleeping
            ? 'grey-darken-4'
            : !initialized
            ? 'transparent'
            : !isPaused
            ? '#007d5c' // green = running
            : 'amber'
        "
        size="x-small"
        elevation="0"
        class="mb-1 mr-1"
        @click="togglePause(null)"
      ></v-btn>
      Live
      <span class="running-status"
        >-
        {{
          sleeping
            ? "sleeping"
            : !initialized
            ? "initializing"
            : !isPaused
            ? "running"
            : "paused"
        }}</span
      >
      <v-btn
        icon="mdi-eye"
        elevation="0"
        :color="webviewOpacity === 1 ? 'orange' : 'transparent'"
        size="x-small"
        class="mb-1 mr-1 float-right"
        @click="toggleWebviewOpacity"
      ></v-btn>
    </h3>
  </div>
</template>

<script>
import JobCard from "@/components/crawler/JobCard.vue";
import { computed } from "vue";
import * as shared from "@/helpers/shared.js";
import { selectors } from "@/helpers/selectors.js";
import { useDisplay } from "vuetify";

export default {
  props: {
    url: String,
    selectedJob: Object,
  },
  components: {
    JobCard,
  },
  emits: ["auth-required", "auth-not-required", "job-data", "jobSelected"],
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
      getJobStatusClass: shared.getJobStatusClass,
      hideOverlay: false,
      lastSearchCycleCompleted: null,
      sleeping: false,
      initialized: false,
      continueProcessing: null,
      pollingInterval: null,
      jobs: [],
      jobQueue: [],
      jobDelay: 4000,
      processingQueue: false,
      isPaused: false,
      isPaused_existing: null,
      domain: "linkedin",
      sessionID: null,
      preload: null,
      messageContainer: null,
      jobCompletionInterval: null,
      searches: [
        "SaaS Product Manager",
        "Compliance Product Owner",
        "E-commerce Intelligence",
        "Channel Compliance",
        "AI Product Manager",
        "B2B SaaS",
        "Price Monitoring",
        "Brand Protection",
        "Entrepreneur in Residence",
        "CTO",
      ],
      webviewOpacity: 0,
      domReadyListenerAdded: false,
      testPageUrl: `${window.location.origin}/intro.html`,
      can_generate_percents: true,
      user_loaded: false,
      working_job_count: 0,
      selectors,
    };
  },
  async mounted() {
    if (window.electron) {
      if (window.electron.onJobNew) {
        window.electron.onJobNew(async (jobData) => {
          // console.log("Received new job data in component!:", jobData);
          await this.processData(jobData);
        });
      }

      window.electron.reloadUser(this.user.token);
      window.electron.onUserReloaded(async (event, userdata) => {
        this.user_loaded = true;
        this.working_job_count = userdata.autopilot.usage.daily_job_count;
        this.companyFilters = userdata.autopilot.company_filters;
        console.log(this.companyFilters, "onUserReloaded.companyFilters");

        await this.fetchPreloadPath();
        let guid = shared.getGuid();
        this.sessionID = guid;

        setTimeout(async () => {
          const webview = document.querySelector("webview");
          if (!webview) {
            console.error("onUserReloaded.Webview is not initialized.");
            return;
          }
          webview.preload = this.preload;
          // console.log(webview.preload, "webview.preload");

          //  console.log(userdata.autopilot, "this.user.autopilot");
          //  console.log(userdata.autopilot.usage, "this.user.autopilot.usage");
          this.can_generate_percents =
            userdata.autopilot.usage.generate_percents;

          await this.startQueueProcessing();
        }, 1000);
      });
    }
    window.addEventListener("beforeunload", this.cleanupWebview);
  },
  beforeUnmount() {
    if (window.electron && window.electron.removeJobNewListener) {
      window.electron.removeJobNewListener();
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.cleanupWebview();
    window.removeEventListener("beforeunload", this.cleanupWebview);
  },
  watch: {
    selectedJob(newVal) {
      //  console.log(newVal, "watch.selectedJob");

      if (!this.isMdAndUp) {
        this.togglePause(
          newVal === null && this.isPaused_existing !== null
            ? this.isPaused_existing
            : false
        );
      }
    },
  },
  methods: {
    onNewCompanyFilter(payload) {
      // alert("in JobSiteWebView.onNewCompanyFilter!");
      this.companyFilters.push(shared.transformCompanyFilter(payload));

      const webview = this.$refs.linkedinWebView;
      if (!webview) {
        console.error("Webview is not initialized.");
        return;
      }
      try {
        return webview.executeJavaScript(`
      (async () => {
        window.autopilotConfig.companyFilters = ${JSON.stringify(
          this.companyFilters
        )};
        console.log(window.autopilotConfig.companyFilters, 'RESET window.autopilotConfig.companyFilters');
      })();`);
      } catch (exc) {
        console.error("resetting window.autopilotConfig.companyFilters failed");
      }
    },
    onWillNavigate() {
      //     console.log("Navigation started:", event.url);
    },
    onDidNavigate() {
      //    console.log("Navigation completed:", event.url);
    },
    cleanupWebview() {
      const webview = this.$refs.linkedinWebView;
      if (webview) {
        webview.removeEventListener("dom-ready", this.onDomReady);
        webview.removeEventListener("will-navigate", this.onWillNavigate);
        webview.removeEventListener("did-navigate", this.onDidNavigate);
      }
    },
    emitJob(job) {
      if (job === this.selectedJob) job = null;
      if (!this.isMdAndUp && job) this.isPaused_existing = this.isPaused;

      //   console.log(job, "JobSiteWebView.emitJob");
      this.$emit("jobSelected", job);

      setTimeout(() => {
        if (!this.isMdAndUp) {
          if (job) {
            this.togglePause(true);
          } else {
            this.togglePause(this.isPaused_existing);
          }
        }
      }, 1000);
    },
    async onDomReady() {
      // (this.domReadyListenerAdded, "onDomReady");
      if (!this.domReadyListenerAdded) {
        this.startAutopilot();
        this.domReadyListenerAdded = true;
        const webview = this.$refs.linkedinWebView;
        if (!webview) return;
        setTimeout(() => {
          try {
           // webview.openDevTools();
          } catch {
            console.log("openDevTools failed");
          }

          if (this.user.last_search_cycle) {
            this.lastSearchCycleCompleted = this.user.last_search_cycle;
            this.updateWebviewLastSearchCycle();
          }

          this.initialized = true;
        }, 1500);
      } else {
        const webview = this.$refs.linkedinWebView;
        if (!webview) {
          console.error("Webview is not initialized.");
          return;
        }
        const loggedIn = await shared.checkSignInButton(
          webview,
          this.selectors.signInSignals
        );
        // console.log(loggedIn, "onDomReady.loggedIn");
        if (!loggedIn) {
          this.$emit("auth-required");
        }
      }
    },
    async waitForElementToDisappear(webview, selector) {
      await webview.executeJavaScript(`
          new Promise((resolve) => {
            const checkElement = () => {
              const element = document.querySelector('${selector}');
              if (!element || element.offsetParent === null) {
                resolve();
              } else {
                setTimeout(checkElement, 100);
              }
            };
            checkElement();
          });
        `);
    },
    onJobSaved() {
      //     console.log(saveData, "onJobSaved");
    },
    onJobVoted(voteData) {
      //    console.log(voteData, "onJobVoted");
      const jobIndex = this.jobs.findIndex((job) => job.id === voteData.jobId);
      if (jobIndex !== -1) {
        this.jobs[jobIndex] = {
          ...this.jobs[jobIndex],
          vote: voteData.vote,
          vote_feedback: voteData.feedback,
        };
      }
    },
    toggleWebviewOpacity() {
      if (this.webviewOpacity === 1) {
        this.webviewOpacity = 0;
        this.hideOverlay = false;
      } else {
        this.webviewOpacity = 1;
        this.hideOverlay = false;
      }
    },
    toggleHideOverlay() {
      if (this.hideOverlay) {
        this.hideOverlay = false;
        this.webviewOpacity = 0;
      } else {
        this.hideOverlay = true;
        this.webviewOpacity = 0;
      }
    },
    togglePause(set_val = null) {
      // console.log(set_val, "togglePause");
      if (!this.initialized) return;

      this.isPaused = set_val !== null ? set_val : !this.isPaused;
      const webview = this.$refs.linkedinWebView;
      if (!webview) {
        console.error("Webview is not initialized.");
        return;
      }

      const setPausedScript = `window.isPaused = ${this.isPaused};`;
      const continueProcessingScript = `
    try {
      if (window.continueProcessing) {
      //   console.log('executing window.continueProcessing');
        window.continueProcessing();
      //   console.log('executed window.continueProcessing');
      } else {
     //    console.log('window.continueProcessing doesnt exist');
      }
    } catch (err) {
      console.error('Error executing continueProcessing script:', err);
    }
  `;

      webview
        .executeJavaScript(setPausedScript)
        .then(() => {
          // console.log(
          //   `System should be ${
          //     !this.initialized
          //       ? "initializing"
          //       : this.isPaused
          //       ? "paused"
          //       : "running"
          //   }`
          // );

          if (!this.isPaused) {
            webview.executeJavaScript(continueProcessingScript).catch((err) => {
              console.error("Error executing continueProcessing script:", err);
            });

            if (this.continueProcessing) this.continueProcessing();
          }
        })
        .catch((err) => {
          console.error("Error setting window.isPaused:", err);
        });
    },

    async pollForJobCompletion() {
      //     console.log("Polling for results...");
      try {
        const checkResponse = await window.electron.checkJobCompletion(
          this.sessionID
        );
        //     console.log(checkResponse, "results");
        const autoJobs = checkResponse.jobs;
        const usage = checkResponse.usage;
        this.can_generate_percents = usage.generate_percents;

        let updatedJobs = this.jobs.map((job) => {
          const autoJobIndex = autoJobs.findIndex((aj) => aj.guid === job.id);

          if (autoJobIndex !== -1 && !job.skipped) {
            let autoJob = autoJobs[autoJobIndex];
            return {
              ...job,
              status: "",
              percentage: autoJob.percentage
                ? Math.ceil(parseFloat(autoJob.percentage))
                : null,
            };
          }

          return job;
        });

        this.jobs = updatedJobs;

        const hasReviewingJobs = this.jobs.some(
          (job) => job.status === "Reviewing"
        );

        if (!hasReviewingJobs) {
          this.stopPollJobCompletion();
        }
      } catch (error) {
        console.error("Error polling job completion:", error);
      }
    },
    async startQueueProcessing() {
      await this.processQueue();

      if (!this.pollingInterval)
        this.pollingInterval = setInterval(async () => {
          if (this.jobs.filter((job) => !job.nopercent).length > 0) {
            await this.pollForJobCompletion();
          } else {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
          }
        }, 5000);
    },
    stopPollJobCompletion() {
      if (this.pollingInterval) {
        //    console.log("Stopping job polling...");
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },
    async processData(jobData) {
      //    console.log(`evaluating job: ${jobData.title} @  ${jobData.employer}`);
      this.jobDelay = 4000;
      const foundInExistingJobs = this.user.existing_jobs.findIndex(
        (f) => f.siteid == jobData.siteId
      );
      const foundInJobQueue = this.jobQueue.findIndex(
        (f) => f.siteId == jobData.siteId
      );
      const foundInJobs = this.jobs.findIndex(
        (f) =>
          f.siteId == jobData.siteId ||
          (f.title == jobData.title && f.employer == jobData.employer)
      );

      if (
        foundInExistingJobs > -1 ||
        foundInJobQueue > -1 ||
        foundInJobs > -1
      ) {
        //   console.log(" > job already processed");
        jobData.skipped = true;
        this.jobDelay = 0;
        return;
      }

      if (jobData.applicantCount >= this.user.autopilot.max_applicants) {
        // console.log(
        //   ` > job has too many applicants (${this.user.autopilot.max_applicants})`
        // );
        jobData.status = "Skipped - too many applicants";
        jobData.skipped = true;
        this.jobDelay = 0;
      }
      jobData.voted_jobs = this.filterAndSortVotedJobs();

      if (!jobData.skipped) {
        // console.log(
        //   this.can_generate_percents,
        //   this.working_job_count,
        //   this.user.autopilot.usage.daily_limit,
        //   "this.can_generate_percents @ this.jobQueue.push"
        // );
        jobData.nopercent =
          !this.can_generate_percents ||
          this.working_job_count >= this.user.autopilot.usage.daily_limit;

        if (
          this.can_generate_percents &&
          this.working_job_count >= this.user.autopilot.usage.daily_limit
        )
          this.can_generate_percents = false;

        if (jobData.nopercent) {
          jobData.status = "Saved";
        }
        this.jobQueue.push(jobData);
        this.working_job_count++;

        if (!this.processingQueue) {
          await this.startQueueProcessing();
        }
      }
    },
    updateWebviewJobs() {
      const webview = this.$refs.linkedinWebView;
      if (webview) {
        const combinedJobs = JSON.stringify([
          ...this.user.existing_jobs,
          ...this.jobs,
        ]);
        webview.executeJavaScript(`
        //   console.log('Setting window.existingJobs in webview context');
           window.existingJobs = ${combinedJobs};
        //   console.log(window.existingJobs.length, 'window.existingJobs');
         `);
      }
    },
    updateWebviewLastSearchCycle() {
      // console.log(
      //   this.lastSearchCycleCompleted,
      //   "this.lastSearchCycleCompleted"
      // );
      if (
        !this.lastSearchCycleCompleted ||
        !(this.lastSearchCycleCompleted instanceof Date) ||
        isNaN(Date.parse(this.lastSearchCycleCompleted))
      )
        return;

      const webview = this.$refs.linkedinWebView;
      if (webview) {
        const lastSearchCycleCompleted =
          this.lastSearchCycleCompleted.toISOString();
        webview.executeJavaScript(`
  //    console.log('Setting window.lastSearchCycle in webview context');
      window.lastSearchCycleCompleted = new Date('${lastSearchCycleCompleted}');
  //    console.log(window.lastSearchCycleCompleted, 'window.lastSearchCycleCompleted');
    `);
      }
    },
    async processQueue() {
      if (this.isPaused) {
        await new Promise((resolve) => {
          this.continueProcessing = resolve;
        });
      }

      if (this.jobQueue.length > 0) {
        console.log(this.jobQueue, "this.jobQueue");
        this.processingQueue = true;
        const jobData = this.jobQueue.shift();

        const delay =
          (this.jobs.length > 0 || this.jobQueue.length > 0) && !jobData.skipped
            ? this.jobDelay
            : 0;
        // console.log(delay, "delay");
        setTimeout(async () => {
          this.jobs.push(jobData);
          console.log(this.jobs, "this.jobs");
          if (!jobData.dupe) {
            // console.log(jobData, " > sending job to db");
            window.electron.saveJob(JSON.parse(JSON.stringify(jobData)));
          }
          this.$nextTick(() => {
            try {
              const container = this.$refs.jobRow.$el;
              container.scrollTop = container.scrollHeight;
            } catch {
              return null;
            }
          });
          // console.log(delay, "delay");
          // console.log("Added job:", jobData);
          await this.startQueueProcessing();
        }, delay);
      } else {
        this.processingQueue = false;
      }
    },
    async fetchPreloadPath() {
      try {
        const dirname = await window.electron.getDirname();
        const safeDirname = dirname.replace(/\\/g, "/");
        this.preload = `file:///${safeDirname}/test-preload.js`;
      } catch {
        //  console.log(null, "fetchPreloadPath");
        return null;
      }
      //  console.log(this.preload, "fetchPreloadPath");
    },
    async startAutopilot() {
      //   console.log("autopilot initialized");

      const webview = this.$refs.linkedinWebView;
      if (!webview) {
        console.error("Webview is not initialized.");
        return;
      }
      //   console.log(this.preload, "this.preload");
      webview.preload = this.preload;
      this.updateWebviewJobs();
      try {
        await this.performSearch();
      } catch (error) {
        console.error("Failed to initiate autopilot:", error);
      }
    },
    async performSearch() {
      const webview = this.$refs.linkedinWebView;
      if (!webview) {
        console.error("Webview is not initialized.");
        return;
      }

      for (const term of this.user.autopilot.searches.sort(
        () => Math.random() - 0.5
      )) {
        // console.log(this.isPaused, "performSearch.this.isPaused");
        if (this.isPaused) {
          //     console.log("Search paused");
          await new Promise((resolve) => {
            this.continueProcessing = resolve;
          });
        }

        //    console.log(`Performing search "${term}"`);
        await this.typeSearchTerm(term);

        const script = `
        const ele = document.querySelector('${this.selectors.applicationOverlayContainer}');
        ele.remove();
      `;

        await webview.executeJavaScript(script).catch((error) => {
          console.error("Script execution failed:", error);
          return false;
        });
        //    console.log("executing search: ", term);
        await this.scrollToBottomAndLogLinks(webview, term);
        // console.log("search COMPLETED");
        await new Promise((resolve) =>
          setTimeout(resolve, Math.floor(Math.random() * 5000) + 1000)
        );
        // console.log("done");
      }
      this.sleeping = true;
      this.lastSearchCycleCompleted = new Date();
      window.electron.searchCycleCompleted(this.lastSearchCycleCompleted);
      this.updateWebviewLastSearchCycle();
      console.log("zzzzZZzzzz  - Sleeping until next search cycle");
      await shared.delay(180000);
      this.sleeping = false;
      console.log("Sleeping cycle complete");
      await this.performSearch();
    },
    createSearchUrl(term) {
      const baseUrl = this.url;
      let dateFilter = "f_TPR=r86400";

      if (
        !this.user.last_search_cycle ||
        !(this.user.last_search_cycle instanceof Date) ||
        isNaN(Date.parse(this.user.last_search_cycle))
      ) {
        dateFilter = "f_TPR=r2592000";
      }

      return `${baseUrl}&${dateFilter}&keywords=${term}`;
    },
    async typeSearchTerm(term) {
      term = term.replace(/'/g, "");
      const webview = this.$refs.linkedinWebView;
      if (!webview) {
        console.error("Webview is not initialized.");
        return;
      }

      this.user.autopilot;

      try {
        webview.src = this.createSearchUrl(term);

        await new Promise((resolve) => {
          webview.addEventListener("dom-ready", resolve, { once: true });
        });
      } catch {
        //    console.log("type search term failed");
      }

      const isSignedIn = await shared.checkSignInButton(
        webview,
        this.selectors.signInSignals
      );
      // console.log(isSignedIn, "typeSearchTerm.isSignedIn");
      if (!isSignedIn) {
        this.$emit("auth-required");
      }
      this.updateWebviewJobs();

      await this.waitForElementToDisappear(
        webview,
        this.selectors.initialLoadAnimation
      );

      this.updateWebviewLastSearchCycle();
    },

    filterAndSortVotedJobs() {
      const sendCount = 20;

      let filteredJobs = this.jobs.filter((job) => job.vote !== null);

      let sortedJobs = filteredJobs.sort((a, b) => b.id - a.id);
      let votedJobs = sortedJobs.slice(0, sendCount).map((job) => ({
        vote: job.vote,
        vote_feedback: job.vote_feedback,
        percentage: job.percentage,
        title: job.title,
        employer: job.employer,
      }));

      if (votedJobs.length < sendCount) {
        const remainingCount = sendCount - votedJobs.length;
        const remainingJobs = this.user.existing_jobs
          .filter((job) => job.vote !== null)
          .sort((a, b) => b.id - a.id)
          .slice(0, remainingCount)
          .map((job) => ({
            vote: job.vote,
            vote_feedback: job.vote_feedback,
            percentage: job.percentage,
            title: job.title,
            employer: job.employer_name,
          }));

        votedJobs = votedJobs.concat(remainingJobs);
      }

      return votedJobs;
    },

    filterAndSortJobs() {
      const sendCount = 15;

      let filteredJobs = this.jobs.filter(
        (job) => job.percentage !== undefined
      );

      let sortedJobs = filteredJobs.sort((a, b) => b.id - a.id);
      let mappedJobs = sortedJobs.slice(0, sendCount).map((job) => ({
        percentage: job.percentage,
        title: job.title,
      }));

      if (mappedJobs.length < sendCount) {
        const remainingCount = sendCount - mappedJobs.length;
        const remainingJobs = this.user.existing_jobs
          .filter(
            (job) => job.percentage !== undefined && job.percentage !== null
          )
          .sort((a, b) => b.id - a.id)
          .slice(0, remainingCount)
          .map((job) => ({
            percentage: job.percentage,
            title: job.title,
          }));

        mappedJobs = mappedJobs.concat(remainingJobs);
      }

      return mappedJobs;
    },
    scrollToBottomAndLogLinks(webview, search) {
      try {
        // console.log(
        //   this.user.autopilot.negative_keywords,
        //   "this.user.autopilot.negative_keywords"
        // );
        // console.log("SCROLLING!");
        return webview.executeJavaScript(`
  (async () => {
    window.continueProcessing = () => {};
    window.autopilotConfig = {
      isPaging: false,
      searchType: null,
      negativeKeywords: ${JSON.stringify(
        this.user.autopilot.negative_keywords
      )},
      companyFilters: ${JSON.stringify(this.companyFilters)},
    };
    // alert(JSON.stringify(window.autopilotConfig.negativeKeywords.length))
    // console.log(window.autopilotConfig,'window.autopilotConfig')

    function smoothScrollToBottom(container) {
      return new Promise(resolve => {
        let lastScrollHeight = container.scrollHeight;
        let currentScrollPosition = container.scrollTop;

        function smoothScroll() {
          const totalHeight = container.scrollHeight;
          const step = totalHeight / 30;

          if (currentScrollPosition < totalHeight) {
            currentScrollPosition += step;
            container.scrollTop = currentScrollPosition;
            setTimeout(smoothScroll, 40);
          } else {
            setTimeout(() => {
              if (container.scrollHeight > lastScrollHeight) {
                lastScrollHeight = container.scrollHeight;
                smoothScroll();
              } else {
                resolve();
              }
            }, 500);
          }
        }
        smoothScroll();
      });
    }

    function getApplicantCount() {
      const jobDetailsDiv = document.querySelectorAll('${
        this.selectors.primaryDescriptionContainer
      }')[0];
      let applicantCount = 0;
      try {
        if (jobDetailsDiv) {
          const spans = jobDetailsDiv.querySelectorAll('span');
          spans.forEach(span => {
            let match;
            if (span.innerText.toLowerCase().includes('applicant')) {
              match = span.innerText.match(/(\\d+)\\s*applicants?/i);
            }
            if (span.innerText.toLowerCase().includes('people clicked apply')) {
              let txt = span.innerText.toLowerCase();
              txt = txt.replace('over', '');
              match = txt.match(/(\\d+)\\s*people clicked apply?/i);
            }

            if (match) {
              applicantCount = parseInt(match[1]);
            } else if (span.innerText.toLowerCase().includes('0 applicants')) {
              applicantCount = 0;
            }
          });
        }

        if (applicantCount >= 0) {
     //      console.log(applicantCount + ' applicants');
        } else {
     //      console.log('No span with "applicants" found');
        }
      } catch (error) {
        console.error('Error:', error);
      }
      return applicantCount;
    }

   const delay = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    function getJobDescription() {
        let description = document.querySelector('${
          this.selectors.jobDetails
        }').innerText;
        const jobDetailsContent = document.querySelector('${
          this.selectors.jobViewLayout
        }');
        const clone = jobDetailsContent.cloneNode(true);
        const elementsToRemove = clone.querySelectorAll('${
          this.selectors.primaryDescriptionContainer
        }, ${
          this.selectors.scaffoldToolbar
        }, .job-details-jobs-unified-top-card__job-insight.job-details-jobs-unified-top-card__job-insight--highlight, .job-details-jobs-unified-top-card__job-insight, .coach-mark-list__container, .mt5');
        elementsToRemove.forEach(el => el.parentNode.removeChild(el));
        description = clone.innerText + '\\n\\n' + description;

        const salaryElement = document.querySelector('${
          this.selectors.salary
        }');
        if (salaryElement) {
            const salaryInfo = salaryElement.innerText.trim();
            if (salaryInfo) {
                description += '\\n\\nSalary: ' + salaryInfo;
            }
        }

      return description.replace(/\\s+/g, ' ').trim();
    }

    function stopFilteredCompany(jobData) {
    // console.log('Starting company filter check for job:', jobData.employer);

    const isFiltered = window.autopilotConfig.companyFilters.some(companyFilter => {
        // Check if the job's employer (lowercased) matches any lowercased company names in the filters
        const employerMatches = jobData.employer.toLowerCase() === companyFilter.company_name_lower;

        // console.log('Checking employer: ', jobData.employer, ' against filtered company: ', companyFilter.company_name,'. Match found: ',employerMatches);

        if (employerMatches) {
            console.log(' >> Job from ',  jobData.employer, ' is FILTERED out due to existing company filter');
            return true;  // Stop the job from being processed further
        }

        return false;  // No need to filter this job, continue checking others
    });

    console.log('Filter result for company ' + jobData.employer + ':', isFiltered);
    return isFiltered;
}

     function stopFiltered(jobData) {
        // console.log('Starting filter check for job:', jobData.title);

        const isFiltered = window.autopilotConfig.negativeKeywords.some(keywordObj => {
        // console.log('Checking keyword:', keywordObj.keyword, 'with applies setting:', keywordObj.applies_to);

        if (keywordObj.applies_to === 'both' || keywordObj.applies_to === 'title') {
          const titleContainsKeyword = jobData.title.toLowerCase().includes(keywordObj.keyword.toLowerCase());
         // console.log(\`Title '\${jobData.title}' contains keyword '\${keywordObj.keyword}': \${titleContainsKeyword}\`);
          return titleContainsKeyword;
        }

        // Example to extend with 'description' check
        if (keywordObj.applies_to === 'description' && jobData.description) {
          const descriptionContainsKeyword = jobData.description.toLowerCase().includes(keywordObj.keyword.toLowerCase());
         // console.log(\`Description '\${jobData.description}' contains keyword '\${keywordObj.keyword}': \${descriptionContainsKeyword}\`);
          return descriptionContainsKeyword;
        }

        // Log when no applicable condition matches
        console.log('No applicable filter condition met for keyword:', keywordObj.keyword);
        return false;
      });

     console.log('Filter result for job ' + jobData.title + ':', isFiltered);
      return isFiltered;
    }

    function stopDupeJobs(jobData) {
     const existingJobs = window.existingJobs || [];
     const siteIdArray = existingJobs.map((m) => m.siteid);
     const siteIdMatch = siteIdArray.includes(jobData.siteId);

     if (siteIdMatch){
    //   console.log('stopDupe due to siteId', jobData.siteId)
      return true;
     }

    const titleEmployerMatch = existingJobs.some((job) => {
      const jobAddedDate = new Date(job.added);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return job.title === jobData.title &&
            job.employer_name === jobData.employer &&
            jobAddedDate > twentyFourHoursAgo;
    });

     return titleEmployerMatch;
   }

async function clickLinksSequentially(jobCards) {
 //  console.log(jobCards, 'clickLinksSequentially');
  return new Promise(async (resolve) => {
    let jobIndex = 0;
    for (let jobCard of jobCards) {
 //      console.log(jobIndex + 1, 'processing job card of: ' + jobCards.length);
      jobIndex++;

      if (window.isPaused) {
        await new Promise((resume) => {
          window.continueProcessing = resume;
        });
      }

   //    console.log(jobCard, 'jobCard')
      const siteId = jobCard.getAttribute('${this.selectors.siteIdSelector}');
      // alert(siteId);
      const linkElement = jobCard.querySelector('${
        this.selectors.jobCardListTitle
      }');
    //   console.log(jobCard, 'jobCard');
    //   console.log(linkElement, 'linkElement');

      const linkText = linkElement ? linkElement.textContent.trim() : 'No title found';

      if (linkText === 'No title found') {
        alert('No title found');
      //   console.log(document.body, 'delaying for 10 minutes so you can inspect');
        await delay(600000);
      }
      // alert(linkText)

      const employerElement = jobCard.querySelector('${
        this.selectors.jobCardPrimaryDescription
      }');
      const employer = employerElement ? employerElement.textContent.trim() : 'No employer found';
      let dupe = false, skipped = false;

      const jobData = {
        title: linkText,
        employer: employer,
        siteId: siteId,
      };
       console.log(jobData, 'jobData');

      const stopDupe = stopDupeJobs(jobData);
       console.log(stopDupe, 'stopDupe');
      if (stopDupe) {
    //     console.log(stopDupeJobs(jobData), 'stopDupeJobs(jobData)');
        dupe = true;
        skipped = true;
        if (window.autopilotConfig.searchType === 'refresh') {
          resolve(true);
          return;
        }
      }

      let isFilteredCompany = false;
      if(!stopDupe) {
        isFilteredCompany = stopFilteredCompany(jobData);
        // console.log(isFilteredCompany, 'isFilteredCompany');
        if (isFilteredCompany) {
          skipped = true;
        }
      }

      if(!isFilteredCompany) {
          let isFiltered = stopFiltered(jobData);
          console.log(isFiltered, 'isFiltered');
          if (isFiltered) {
            skipped = true;
          }
      }

      const url = 'https://www.linkedin.com/jobs/search/?currentJobId=' + siteId;
      const jobDetails = {
        domain: '${this.domain}',
        siteId: siteId,
        title: linkText,
        url: url,
        employer: employer,
        search: '${search}',
        sessionID: '${this.sessionID}',
        status: 'Reviewing',
        skipped: skipped,
        dupe: dupe,
        vote: null,
        vote_feedback: "",
        previous_jobs: ${JSON.stringify(this.filterAndSortJobs())},
      };
     //  console.log(jobDetails, 'jobDetails');

      if (linkElement && !jobDetails.skipped) {
        if (linkElement.offsetParent === null) {
          window.history.back();
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        linkElement.click();
        await new Promise((resolve) => setTimeout(resolve, 4000));

        jobDetails.description = getJobDescription();
        jobDetails.applicantCount = getApplicantCount();
      //   console.log(jobDetails.applicantCount, 'jobDetails.applicantCount');

        isFiltered = stopFiltered(jobDetails);
        // console.log(isFiltered, 'isFiltered2');
        if (isFiltered) {
          jobDetails.skipped = true;
        }
      }
    //   console.log(jobDetails, 'jobDetails');

      try {
       window.electronAPI.jobDiscovered(jobDetails);
      } catch (error) {
        console.error('Error sending job details:', error);
      }
    }
    resolve(false);
  });
}

  async function processJobPages(container) {
  const maxPages = 3;
  let currentPage = 1;

  while (currentPage <= maxPages) {
    try {
      await smoothScrollToBottom(container);
      document.querySelectorAll('${
        this.selectors.msgOverlay
      }').forEach(element => {
        element.remove();
      });

      const jobCards = document.querySelectorAll('${
        this.selectors.scaffoldList
      }');
      const shouldStop = await clickLinksSequentially(jobCards);
    //   console.log(shouldStop, 'shouldStop');

    //   console.log('Scrolled to bottom and ready to log links.');
    //   console.log(window.autopilotConfig.isPaging, 'window.autopilotConfig.isPaging')

      if (shouldStop) {
   //      console.log('Stopping paging due to duplicate job found.');
        break;
      }

      if (currentPage < maxPages && window.autopilotConfig.isPaging) {
        const nextPageButton = document.querySelector('${
          this.selectors.nextPageButton
        }');
        if (nextPageButton && nextPageButton.offsetParent !== null) {
         //  console.log('clicking next page')
          nextPageButton.click();
          await new Promise(resolve => setTimeout(resolve, 4000));
          currentPage++;
        } else {
          break;
        }
      } else {
        break;
      }
    } catch (err) {
      console.error("Error during scrolling:", err);
      break;
    }
  }
  return true;
}

const hoursToRefresh = 1;
const hoursInMillis = hoursToRefresh * 60 * 60 * 1000;
if (
      !window.lastSearchCycleCompleted ||
      !(window.lastSearchCycleCompleted instanceof Date) ||
      isNaN(Date.parse(window.lastSearchCycleCompleted))
    ) {
   //    console.log("No last search cycle completed date found.");
      window.autopilotConfig.isPaging = true;
    } else if (window.lastSearchCycleCompleted instanceof Date) {
  const timeDifference = new Date() - window.lastSearchCycleCompleted;
  const minutes = Math.floor(timeDifference / 60000);
  const seconds = ((timeDifference % 60000) / 1000).toFixed(0);
 //  console.log('Time since Last Search Cycle:', minutes + ':' + seconds);
  window.autopilotConfig.isPaging = timeDifference > hoursInMillis;
 //  console.log('Time difference is greater than ' + hoursToRefresh + ' hours:', timeDifference > hoursInMillis);
} else {
 //  console.log('Invalid date format for last search cycle completed.');
  window.autopilotConfig.isPaging = false;
}

window.autopilotConfig.searchType = window.autopilotConfig.isPaging ? "full" : "refresh";
//  console.log(window.autopilotConfig, 'window.autopilotConfig');

  try {
    const container = document.querySelector('${
      this.selectors.jobSearchResultsList
    }');
    if (!container) {
      console.error('Container for job listings not found.');
      window.electron.authenticateLinkedIn();
      return false;
    }

    const h1NoJobs = document.querySelector('${
      this.selectors.noResultsBannerImage
    }');
    if (h1NoJobs && h1NoJobs.offsetParent !== null) {
    //   console.log('No Jobs Found for Search!');
      return false;
    } else {
    //   console.log('We have jobs!');
    }

    await processJobPages(container);
    return true;
  } catch (err) {
    console.error("Error during job processing:", err);
    return false;
  }
})();
      `);
      } catch (exc) {
        console.error("scrollToBottomAndLogLinks failed");
      }
    },

    executeJavaScriptInWebview(script) {
      return new Promise((resolve, reject) => {
        const webview = this.$refs.linkedinWebView;
        if (webview) {
          webview.executeJavaScript(script, true).then(resolve).catch(reject);
        } else {
          reject(new Error("Webview is not available"));
        }
      });
    },
  },
};
</script>

<style scoped>
.tooltip-text {
  color: black !important;
  text-align: left;
  max-width: 200px;
  padding: 0px;
  white-space: normal;
}
.limit-warn {
  margin-bottom: 100px !important;
}
.loading-message {
  font-size: 24px;
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 150px;
}
.h2-controls {
  border-top: 1px solid #4f4f4f;
  padding-top: 12px;
}
.running-status {
  color: #7b7b7b;
}
.overlay-container {
  background-color: #121212b6;
  padding: 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 115px);
}
.job-master {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 93vh;
}
.job-row.reverse-column {
  padding-top: 10px !important;
  padding-bottom: 0px !important;
}
.job-row {
  flex: 1;
  overflow-y: auto;
  align-items: flex-start;
  justify-content: flex-start;
  flex-wrap: wrap;
  align-content: flex-start;
  padding-bottom: 10px;
}
</style>
