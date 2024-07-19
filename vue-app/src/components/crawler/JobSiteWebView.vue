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
          v-for="(job, index) in jobs"
          :key="index"
          context="live"
          :job="job"
          :ref="'job-' + job.id"
          :selectedJob="selectedJob"
          :getJobStatusClass="getJobStatusClass"
          @jobSelected="emitJob"
          @jobVoted="onJobVoted"
          @jobSaved="onJobSaved"
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
import { useDisplay } from "vuetify";
// const path = require("path");

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
      getJobStatusClass: shared.getJobStatusClass,
      hideOverlay: false,
      lastSearchCycleCompleted: null,
      sleeping: false,
      initialized: false,
      continueProcessing: null,
      // preloadPath: `file://${require("electron").remote.app.getAppPath()}/preload.js`,
      pollingInterval: null,
      jobs: [],
      jobQueue: [],
      jobDelay: 4000,
      processingQueue: false,
      isPaused: false,
      isPaused_existing: null,
      domain: "linkedin",
      sessionID: null,
      // user: null,

      display: useDisplay(),
      // eslint-disable-next-line no-undef
      // preload: path.resolve(__static, "test-preload.js"),
      preload: null,
      // preload: `file:${require("path").resolve(__static, "./test-preload.js")}`,
      // preload: `file://${path.join(__dirname, "test-preload.js")}`,
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
    };
  },
  async mounted() {
    // alert("JobSiteWebView.mounted()");
    if (window.electron) {
      if (window.electron.onJobNew) {
        window.electron.onJobNew(async (jobData) => {
          console.log("Received new job data in component!:", jobData);
          await this.processData(jobData);
        });
      }

      // console.log(this.user.token, "this.user.token");
      window.electron.reloadUser(this.user.token);
      window.electron.onUserReloaded(async (event, userdata) => {
        this.user_loaded = true;
        // this.user = userdata;
        this.working_job_count = userdata.autopilot.usage.daily_job_count;
        console.log(this.user, userdata, "Received user reloaded");

        // if (!this.initialized) {
        await this.fetchPreloadPath();
        let guid = shared.getGuid();
        // guid = "e9cd25c1-4198-4769-b479-b79b2c1e9911";
        this.sessionID = guid;

        const webview = document.querySelector("webview");
        if (!webview) {
          console.error("Webview is not initialized.");
          return;
        }
        webview.preload = this.preload;
        console.log(webview.preload, "webview.preload");

        console.log(userdata.autopilot, "this.user.autopilot");
        console.log(userdata.autopilot.usage, "this.user.autopilot.usage");
        this.can_generate_percents = userdata.autopilot.usage.generate_percents;
        await this.startQueueProcessing();
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
      console.log(newVal, "watch.selectedJob");

      // alert(`selectedJob.isPaused_existing: ${this.isPaused_existing}`);
      //  console.log(this.isPaused_existing, "this.isPaused_existing");
      if (!this.isMdAndUp) {
        // this.isPaused = false;
        this.togglePause(
          newVal === null && this.isPaused_existing !== null
            ? this.isPaused_existing
            : false
        );
        // alert(this.isPaused, "this.isPaused.watch.selectedJob");
      }
    },
    //   jobQueueLength(newLength) {
    //     if (newLength > 0 && !this.processingQueue) {
    //       this.startJobProcessing();
    //     }
    //   },
  },
  computed: {
    // canGeneratePercents() {
    //   // if (!this.user || !this.user.autopilot) return;
    //   return this.can_generate_percents;
    // },
    // getColumnClasses() {
    //   return {
    //     "v-col-12": true,
    //     "v-col-sm-12": this.selectedJob !== null,
    //     "v-col-md-12": this.selectedJob !== null,
    //     "v-col-lg-12": this.selectedJob !== null,
    //     "v-col-sm-6": this.selectedJob === null,
    //     "v-col-md-6": this.selectedJob === null,
    //     "v-col-lg-4": this.selectedJob === null,
    //   };
    // },
  },
  methods: {
    onWillNavigate(event) {
      console.log("Navigation started:", event.url);
    },
    onDidNavigate(event) {
      console.log("Navigation completed:", event.url);
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

      console.log(job, "JobSiteWebView.emitJob");
      this.$emit("jobSelected", job);

      setTimeout(() => {
        if (!this.isMdAndUp) {
          if (job) {
            // Store the current pause state if a job is selected
            this.togglePause(true);
          } else {
            // If no job is selected, use the stored pause state
            this.togglePause(this.isPaused_existing);
          }
        }

        // Scroll the job card to the top of its container
        // if (job) {
        //   const jobRef = this.$refs["job-" + job.id];
        //   if (!jobRef[0]) return;
        //   console.log(jobRef, "jobRef");
        //   console.log(jobRef[0], "jobRef[0]");
        //   if (jobRef && jobRef[0]) {
        //     const jobElement = jobRef[0].$el;
        //     const container = this.$refs.jobContainer.$el;
        //     console.log(container, "container");
        //     console.log(jobElement, "jobElement");

        //     if (jobElement && container) {
        //       const containerRect = container.getBoundingClientRect();
        //       const jobElementRect = jobElement.getBoundingClientRect();
        //       const offset = jobElementRect.top - containerRect.top;

        //       // Adjust the scroll position to scroll near the top with smooth behavior
        //       container.scrollTo({
        //         top: container.scrollTop + offset - 10, // Adjust the 20px as needed
        //         behavior: "smooth",
        //       });
        //     }
        //   }
        // }
      }, 1000);
    },
    async onDomReady() {
      console.log(this.domReadyListenerAdded, "onDomReady");
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

          // alert(`this.user.last_search_cycle: ${this.user.last_search_cycle}`);

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
        const loggedIn = await shared.checkSignInButton(webview);
        console.log(loggedIn, "onDomReady.loggedIn");
        if (!loggedIn) {
          // alert("auth-required1");
          this.$emit("auth-required");
        }
      }
    },
    async waitForElementToDisappear(webview, selector) {
      await webview.executeJavaScript(`
          new Promise((resolve) => {
            const checkElement = () => {
              const element = document.querySelector('${selector}');
              // console.log(element?.offsetParent, 'element.offsetParent');
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
    onJobSaved(saveData) {
      console.log(saveData, "onJobSaved");
    },
    onJobVoted(voteData) {
      console.log(voteData, "onJobVoted");
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
      console.log(set_val, "togglePause");
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
        console.log('executing window.continueProcessing');
        window.continueProcessing();
        console.log('executed window.continueProcessing');
      } else {
        console.log('window.continueProcessing doesnt exist');
      }
    } catch (err) {
      console.error('Error executing continueProcessing script:', err);
    }
  `;

      webview
        .executeJavaScript(setPausedScript)
        .then(() => {
          console.log(
            `System should be ${
              !this.initialized
                ? "initializing"
                : this.isPaused
                ? "paused"
                : "running"
            }`
          );

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
      console.log("Polling for updates...");
      try {
        const checkResponse = await window.electron.checkJobCompletion(
          this.sessionID
        );
        console.log(checkResponse, "checkResponse");
        const autoJobs = checkResponse.jobs;
        const usage = checkResponse.usage;
        this.can_generate_percents = usage.generate_percents;

        // Update the jobs with the new data received
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

        // Check if there are any jobs still reviewing
        const hasReviewingJobs = this.jobs.some(
          (job) => job.status === "Reviewing"
        );

        if (!hasReviewingJobs) {
          this.stopPollJobCompletion(); // No 'Reviewing' jobs left, so stop polling
        }
      } catch (error) {
        console.error("Error polling job completion:", error);
      }
    },
    async startQueueProcessing() {
      // Start processing the queue
      await this.processQueue();

      // Start polling every 5 seconds
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
        console.log("Stopping job polling...");
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
      // Stop the polling mechanism, such as clearing an interval
    },
    async processData(jobData) {
      // jobData.id = shared.getGuid();
      // console.log("Processing job data:", jobData);

      console.log(`evaluating job: ${jobData.title} @  ${jobData.employer}`);
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
        console.log(" > job already processed");
        jobData.skipped = true;
        this.jobDelay = 0;
        return;
      }

      if (jobData.applicantCount >= this.user.autopilot.max_applicants) {
        console.log(
          ` > job has too many applicants (${this.user.autopilot.max_applicants})`
        );
        jobData.status = "Skipped - too many applicants";
        jobData.skipped = true;
        this.jobDelay = 0;
      }
      jobData.voted_jobs = this.filterAndSortVotedJobs();

      if (!jobData.skipped) {
        console.log(
          this.can_generate_percents,
          this.working_job_count,
          this.user.autopilot.usage.daily_limit,
          "this.can_generate_percents @ this.jobQueue.push"
        );
        jobData.nopercent =
          !this.can_generate_percents ||
          this.working_job_count >= this.user.autopilot.usage.daily_limit;

        if (
          this.can_generate_percents &&
          this.working_job_count >= this.user.autopilot.usage.daily_limit
        )
          this.can_generate_percents = false;

        // alert(`jobData.nopercent: ${jobData.nopercent}`);
        if (jobData.nopercent) {
          jobData.status = "Saved";
        }
        this.jobQueue.push(jobData);
        this.working_job_count++;

        // Start processing the queue if not already processing
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
        // console.log(JSON.parse(combinedJobs).length, "combinedJobs");
        webview.executeJavaScript(`
           console.log('Setting window.existingJobs in webview context');
           window.existingJobs = ${combinedJobs};
           console.log(window.existingJobs.length, 'window.existingJobs');
         `);
      }
    },
    updateWebviewLastSearchCycle() {
      console.log(
        this.lastSearchCycleCompleted,
        "this.lastSearchCycleCompleted"
      );
      if (
        !this.lastSearchCycleCompleted ||
        !(this.lastSearchCycleCompleted instanceof Date) ||
        isNaN(Date.parse(this.lastSearchCycleCompleted))
      )
        return;

      const webview = this.$refs.linkedinWebView;
      // console.log(webview, "webview");
      if (webview) {
        const lastSearchCycleCompleted =
          this.lastSearchCycleCompleted.toISOString();
        webview.executeJavaScript(`
      console.log('Setting window.lastSearchCycle in webview context');
      window.lastSearchCycleCompleted = new Date('${lastSearchCycleCompleted}');
      console.log(window.lastSearchCycleCompleted, 'window.lastSearchCycleCompleted');
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
        // Set the processing flag
        this.processingQueue = true;
        // Get the first job in the queue
        const jobData = this.jobQueue.shift();
        // Use setTimeout to simulate delay before adding the job

        const delay =
          (this.jobs.length > 0 || this.jobQueue.length > 0) && !jobData.skipped
            ? this.jobDelay
            : 0;
        console.log(delay, "delay");
        setTimeout(async () => {
          this.jobs.push(jobData);
          if (!jobData.dupe) {
            console.log(jobData, " > sending job to db");
            window.electron.saveJob(JSON.parse(JSON.stringify(jobData)));
          }
          this.$nextTick(() => {
            try {
              const container = this.$refs.jobRow.$el; // Ensure you add a ref="jobRow" to the v-row
              container.scrollTop = container.scrollHeight;
            } catch {
              return null;
            }
          });
          console.log(delay, "delay");
          console.log("Added job:", jobData);
          // console.log(this.jobs, "this.jobs");
          // Continue processing the queue
          await this.startQueueProcessing();
        }, delay);
      } else {
        // No more jobs to process, clear the processing flag
        this.processingQueue = false;
      }
    },
    async fetchPreloadPath() {
      try {
        const dirname = await window.electron.getDirname();
        const safeDirname = dirname.replace(/\\/g, "/");
        this.preload = `file:///${safeDirname}/test-preload.js`;
      } catch {
        console.log(null, "fetchPreloadPath");
        return null;
      }
      console.log(this.preload, "fetchPreloadPath");
    },
    async startAutopilot() {
      console.log("autopilot initialized");

      const webview = this.$refs.linkedinWebView;
      if (!webview) {
        console.error("Webview is not initialized.");
        return;
      }
      console.log(this.preload, "this.preload");
      webview.preload = this.preload;
      // webview.removeEventListener("dom-ready", this.startAutopilot);
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
        console.log(this.isPaused, "performSearch.this.isPaused");
        if (this.isPaused) {
          console.log("Search paused");
          await new Promise((resolve) => {
            this.continueProcessing = resolve;
          });
        }

        // const backButtonSelector = "button.scaffold-layout__detail-back-button";
        // const backButtonScript = `
        //   (async () => {
        //     const backButton = document.querySelector('${backButtonSelector}');
        //     if (backButton && backButton.offsetParent !== null) {
        //       backButton.click();
        //       await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds after clicking
        //     }
        //   })();
        // `;

        // await webview.executeJavaScript(backButtonScript).catch((error) => {
        //   console.error("Back button script execution failed:", error);
        // });

        console.log(`Performing search "${term}"`);
        await this.typeSearchTerm(term); // Ensure this is awaited

        const script = `
        const ele = document.querySelector('.application-outlet__overlay-container');
        ele.remove();
      `;

        await webview.executeJavaScript(script).catch((error) => {
          console.error("Script execution failed:", error);
          return false;
        });
        console.log("executing search...");
        await this.scrollToBottomAndLogLinks(webview, term);
        console.log("search COMPLETED");
        await new Promise((resolve) =>
          setTimeout(resolve, Math.floor(Math.random() * 5000) + 1000)
        );
      }
      this.sleeping = true;
      // window.electron.reloadUser(this.user.token);
      this.lastSearchCycleCompleted = new Date();
      window.electron.searchCycleCompleted(this.lastSearchCycleCompleted);
      this.updateWebviewLastSearchCycle();
      console.log("zzzzZZzzzz  - Sleeping until next search cycle");
      await shared.delay(180000);
      this.sleeping = false;
      console.log("Sleeping cycle complete");
      await this.performSearch();
      // await new Promise((resolve) => setTimeout(resolve, 180000));
    },
    createSearchUrl(term) {
      const baseUrl = this.url;
      let dateFilter = "f_TPR=r86400"; // past 24 hours

      // console.log(
      //   this.user.last_search_cycle,
      //   typeof this.user.last_search_cycle,
      //   Object.keys(this.user.last_search_cycle).length,
      //   "month test"
      // );
      if (
        !this.user.last_search_cycle ||
        !(this.user.last_search_cycle instanceof Date) ||
        isNaN(Date.parse(this.user.last_search_cycle))
      ) {
        // users first time thru should pull last month of jobs instead of day
        dateFilter = "f_TPR=r2592000"; // month
      }

      return `${baseUrl}&${dateFilter}&keywords=${term}`;
    },
    async typeSearchTerm(term) {
      term = term.replace(/'/g, "");
      // console.log(`typing3: ${term}`);
      const webview = this.$refs.linkedinWebView;
      if (!webview) {
        console.error("Webview is not initialized.");
        return;
      }

      this.user.autopilot;
      webview.src = this.createSearchUrl(term);

      // Wait for the dom-ready event
      await new Promise((resolve) => {
        webview.addEventListener("dom-ready", resolve, { once: true });
      });

      const isSignedIn = await shared.checkSignInButton(webview);
      console.log(isSignedIn, "typeSearchTerm.isSignedIn");
      if (!isSignedIn) {
        // alert("auth-required2");
        this.$emit("auth-required");
      }
      this.updateWebviewJobs();

      await this.waitForElementToDisappear(
        webview,
        "div.initial-load-animation"
      );

      this.updateWebviewLastSearchCycle();
    },

    filterAndSortVotedJobs() {
      const sendCount = 20;

      // Filter and sort jobs from this.jobs where vote is not null
      let filteredJobs = this.jobs.filter((job) => job.vote !== null);
      // console.log(filteredJobs, "filteredJobs from this.jobs");

      let sortedJobs = filteredJobs.sort((a, b) => b.id - a.id);
      let votedJobs = sortedJobs.slice(0, sendCount).map((job) => ({
        vote: job.vote,
        vote_feedback: job.vote_feedback,
        percentage: job.percentage,
        title: job.title,
        employer: job.employer,
      }));
      //  console.log(votedJobs, "votedJobs from this.jobs");

      // If not enough jobs, take the remaining from this.user.existing_jobs
      if (votedJobs.length < sendCount) {
        const remainingCount = sendCount - votedJobs.length;
        //  console.log(this.user.existing_jobs, "this.user.existing_jobs");
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
        //   console.log(remainingJobs, "remainingJobs");

        votedJobs = votedJobs.concat(remainingJobs);
      }

      // console.log(votedJobs, "final votedJobs");

      return votedJobs;
    },

    filterAndSortJobs() {
      const sendCount = 15;

      // Filter and sort jobs from this.jobs
      let filteredJobs = this.jobs.filter(
        (job) => job.percentage !== undefined
      );
      // console.log(filteredJobs, "filteredJobs from this.jobs");

      let sortedJobs = filteredJobs.sort((a, b) => b.id - a.id);
      let mappedJobs = sortedJobs.slice(0, sendCount).map((job) => ({
        percentage: job.percentage,
        title: job.title,
      }));
      // console.log(mappedJobs, "mappedJobs from this.jobs");

      // If not enough jobs, take the remaining from this.user.existing_jobs
      if (mappedJobs.length < sendCount) {
        const remainingCount = sendCount - mappedJobs.length;
        // console.log(this.user.existing_jobs, "this.user.existing_jobs");
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
        //  console.log(remainingJobs, "remainingJobs");

        mappedJobs = mappedJobs.concat(remainingJobs);
      }

      //   console.log(mappedJobs, "final mappedJobs");

      return mappedJobs;
    },
    scrollToBottomAndLogLinks(webview, search) {
      // window.electron.sendJobDetails({});

      return webview.executeJavaScript(`
    (async () => {

    window.continueProcessing = () => {};
    const autopilotConfig = {
      isPaging: false,
      searchType: null,
    }

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
                // Check if new items are loaded
                setTimeout(() => {
                    if (container.scrollHeight > lastScrollHeight) {
                        lastScrollHeight = container.scrollHeight;
                        smoothScroll();
                    } else {
                        resolve();
                    }
                }, 500); // Adjust delay as needed to allow lazy loading
            }
        }
        smoothScroll();
    });
}

function getApplicantCount() {
      const jobDetailsDiv = document.querySelectorAll('[class*="job-details-jobs-unified-top-card__primary-description-container"] > div')[0];
      // console.log(jobDetailsDiv, 'jobDetailsDiv');
      let applicantCount = 0;
      try {
        if (jobDetailsDiv) {
          const spans = jobDetailsDiv.querySelectorAll('span');
          spans.forEach(span => {
            // console.log(span.innerText, 'span.innerText');
            let match;
            if (span.innerText.toLowerCase().includes('applicant')) {
              // eslint-disable-next-line no-useless-escape
               match = span.innerText.match(/(\\d+)\\s*applicants?/i);
            }
            if (span.innerText.toLowerCase().includes('people clicked apply')) {
              // eslint-disable-next-line no-useless-escape
              let txt = span.innerText.toLowerCase();
              txt = txt.replace('over', '')
               match = txt.match(/(\\d+)\\s*people clicked apply?/i);
            }

              if (match) {
                applicantCount = parseInt(match[1]);
                // console.log(applicantCount, 'applicantCount');
              } else if (span.innerText.toLowerCase().includes('0 applicants')) {
                applicantCount = 0;
                // console.log(applicantCount, 'applicantCount');
              }
            }
          });
        }

        if (applicantCount >= 0) {
          console.log(applicantCount + ' applicants');
        } else {
          console.log('No span with "applicants" found');
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
        let description = document.getElementById('job-details').innerText;
        const jobDetailsContent = document.querySelector('.job-view-layout.jobs-details');
        const clone = jobDetailsContent.cloneNode(true);
        const elementsToRemove = clone.querySelectorAll('.job-details-jobs-unified-top-card__job-insight.job-details-jobs-unified-top-card__job-insight--highlight, .job-details-jobs-unified-top-card__job-insight, .coach-mark-list__container, .mt5');
        elementsToRemove.forEach(el => el.parentNode.removeChild(el));
        description = clone.innerText + '\\n\\n' + description;

        // Check if #SALARY exists and append its content to the description
        const salaryElement = document.getElementById('SALARY');
        if (salaryElement) {
            const salaryInfo = salaryElement.innerText.trim();
            if (salaryInfo) { // Ensure there's actual text to append
                description += '\\n\\nSalary: ' + salaryInfo;
            }
        }

      // eslint-disable-next-line no-useless-escape
      return description.replace(/\\s+/g, ' ').trim();
    }

    function stopDupeJobs(jobData) {
     // console.log('in stopDupeJobs')
     const existingJobs = window.existingJobs || [];
     // console.log(existingJobs.length, 'existingJobs');
     // console.log(existingJobs[0], 'existingJobs[0]');
     const siteIdArray = existingJobs.map((m) => m.siteid);
     const siteIdMatch = siteIdArray.includes(jobData.siteId);

     // console.log(siteIdArray, 'siteIdArray');
     // console.log(siteIdMatch, 'siteIdMatch');

     if (siteIdMatch){
      console.log('stopDupe due to siteId', jobData.siteId)
      return true;
     }

    //  const titleMatch = existingJobs.some(
    //    (job) => job.title === jobData.title
    //  );
    //  // console.log(titleMatch, 'titleMatch');

    //  const employerMatch = existingJobs.some(
    //    (job) => job.employer_name === jobData.employer
    //  );
     // console.log(employerMatch, 'employerMatch');

    const titleEmployerMatch = existingJobs.some((job) => {
      const jobAddedDate = new Date(job.added);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return job.title === jobData.title &&
            job.employer_name === jobData.employer &&
            jobAddedDate > twentyFourHoursAgo;
    });
    // console.log(titleEmployerMatch, 'titleEmployerMatch');

     return titleEmployerMatch;
   }

async function clickLinksSequentially(jobCards) {
  console.log(jobCards, 'clickLinksSequentially');
  return new Promise(async (resolve) => {
    let jobIndex = 0;
    for (let jobCard of jobCards) {
      console.log(jobIndex + 1, 'processing job card of: ' + jobCards.length);
      jobIndex++;

      if (window.isPaused) {
        await new Promise((resume) => {
          window.continueProcessing = resume;
        });
      }

      const siteId = jobCard.getAttribute('data-job-id');
      const linkElement = jobCard.querySelector('a.job-card-list__title');
      console.log(jobCard, 'jobCard');
      console.log(linkElement, 'linkElement');

      const linkText = linkElement ? linkElement.textContent.trim() : 'No title found';

      if (linkText === 'No title found') {
        alert('No title found');
        console.log(document.body, 'delaying for 10 minutes so you can inspect');
        await delay(600000);
      }

      const employerElement = jobCard.querySelector('.job-card-container__primary-description');
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
        console.log(stopDupeJobs(jobData), 'stopDupeJobs(jobData)');
        dupe = true;
        skipped = true;
        if (autopilotConfig.searchType === 'refresh') {
          // alert('autopilotConfig.isPaging and stopDupe TRUE!');
          resolve(true); // Indicate that processing should stop
          return;
        }
      }

      const url = 'https://www.linkedin.com/jobs/search/?currentJobId=' + siteId;
      const jobDetails = {
        domain: '${this.domain}', // !! hardcoded !!
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
      console.log(jobDetails, 'jobDetails');

      if (linkElement && !jobDetails.skipped) {
        // console.log(linkElement.offsetParent === null, 'linkElement.offsetParent === null');
        if (linkElement.offsetParent === null) {
          window.history.back();
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        linkElement.click(); // This navigates away, stopping the script
        await new Promise((resolve) => setTimeout(resolve, 4000)); // Wait for 4 seconds

        jobDetails.description = getJobDescription();
        jobDetails.applicantCount = getApplicantCount();
        console.log(jobDetails.applicantCount, 'jobDetails.applicantCount');
      }
      console.log(jobDetails, 'jobDetails');

      try {
       // console.log('COMMENTED OUT: window.electronAPI.jobDiscovered')
        window.electronAPI.jobDiscovered(jobDetails);
      } catch (error) {
        console.error('Error sending job details:', error);
      }
    }
    resolve(false); // Indicate that processing should continue
  });
}

  async function processJobPages(container) {
  const maxPages = 3;
  let currentPage = 1;

  while (currentPage <= maxPages) {
    try {
      await smoothScrollToBottom(container);  // Await the promise returned by smoothScrollToBottom
      document.querySelectorAll('.visually-hidden').forEach(element => {
        element.remove();
      });

      const jobCards = document.querySelectorAll('.scaffold-layout__list-container div.job-card-container');
      // console.log(jobCards, 'jobCards');  // Process job cards here
      const shouldStop = await clickLinksSequentially(jobCards);
      // const shouldStop = true;
      console.log(shouldStop, 'shouldStop');

      console.log('Scrolled to bottom and ready to log links.');
      console.log(autopilotConfig.isPaging, 'autopilotConfig.isPaging')

      if (shouldStop) {
        console.log('Stopping paging due to duplicate job found.');
        break; // Exit the loop immediately
      }

      if (currentPage < maxPages && autopilotConfig.isPaging) {
        const nextPageButton = document.querySelector('button[aria-label="View next page"]');
        if (nextPageButton && nextPageButton.offsetParent !== null) {
          console.log('clicking next page')
          nextPageButton.click();
          await new Promise(resolve => setTimeout(resolve, 4000)); // Wait for 4 seconds after clicking
          currentPage++;
        } else {
          break; // No more pages to view
        }
      } else {
        break; // Reached max pages or paging is not enabled
      }
    } catch (err) {
      console.error("Error during scrolling:", err);
      break;
    }
  }
  return true;
}

// console.log(window.lastSearchCycleCompleted, 'window.lastSearchCycleCompleted');
const hoursToRefresh = 1;
const hoursInMillis = hoursToRefresh * 60 * 60 * 1000;
if (
      !window.lastSearchCycleCompleted ||
      !(window.lastSearchCycleCompleted instanceof Date) ||
      isNaN(Date.parse(window.lastSearchCycleCompleted))
    ) {
      console.log("No last search cycle completed date found.");
      autopilotConfig.isPaging = true;
    } else if (window.lastSearchCycleCompleted instanceof Date) {
  const timeDifference = new Date() - window.lastSearchCycleCompleted;
  const minutes = Math.floor(timeDifference / 60000);
  const seconds = ((timeDifference % 60000) / 1000).toFixed(0);
  console.log('Time since Last Search Cycle:', minutes + ':' + seconds);
  autopilotConfig.isPaging = timeDifference > hoursInMillis;
  console.log('Time difference is greater than ' + hoursToRefresh + ' hours:', timeDifference > hoursInMillis);
} else {
  console.log('Invalid date format for last search cycle completed.');
  autopilotConfig.isPaging = false;
}

autopilotConfig.searchType = autopilotConfig.isPaging ? "full" : "refresh";
console.log(autopilotConfig, 'autopilotConfig');

  try {
    const container = document.querySelector('.jobs-search-results-list');
    if (!container) {
      console.error('Container for job listings not found.');
      window.electron.authenticateLinkedIn();
      return false;
    }

    const h1NoJobs = document.querySelector('.jobs-search-no-results-banner__image');
    if (h1NoJobs && h1NoJobs.offsetParent !== null) {
      console.log('No Jobs Found for Search!');
      return false;
    } else {
      console.log('We have jobs!');
    }

    await processJobPages(container);
    return true;
  } catch (err) {
    console.error("Error during job processing:", err);
    return false;
  }
})();
      `);
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
  max-width: 200px; /* Adjust the width as needed */
  padding: 0px;
  white-space: normal; /* Ensure the text wraps */
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
  /* padding-bottom: 8px; */
}
.running-status {
  color: #7b7b7b;
  /* font-size: 30px; */
}
.overlay-container {
  background-color: #121212b6;
  padding: 0; /* Remove padding if it's not needed */
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  margin-bottom: 52px;
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
  overflow-y: auto; /* Allows scrolling */
  align-items: flex-start; /* Align items to the top */
  justify-content: flex-start; /* Justify items to the top */
  flex-wrap: wrap; /* Allow wrapping of columns */
  align-content: flex-start; /* Align content to the top */
  padding-bottom: 10px;
}
</style>
