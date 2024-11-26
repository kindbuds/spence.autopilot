<template>
  <div class="job-master">
    <webview
      v-if="preload"
      :preload="preload"
      id="linkedin-webview"
      ref="jobsiteWebView"
      class="webview live"
      :class="[{ 'limit-warn': dailyLimitAlertShown }]"
      :src="testPageUrl"
      useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0"
      @dom-ready="onDomReady"
      @will-navigate="onWillNavigate"
      @did-navigate="onDidNavigate"
      :webpreferences="'nodeIntegration=yes'"
      :style="{
        width: !isMdAndUp ? '100vw' : '100%',
        opacity: webviewOpacity === 1 || hideOverlay ? 1 : 0,
      }"
    ></webview>

    <v-container
      v-if="!hideOverlay"
      class="overlay-container"
      :class="[
        isMdAndUp ? 'pb-0 pt-3' : 'pa-2 pb-0',
        { 'limit-warn': dailyLimitAlertShown },
      ]"
      :style="{
        opacity: webviewOpacity === 1 ? 0.7 : 1,
      }"
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
              class="circular-1"
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
              class="circular-2"
            ></v-progress-circular>
          </v-col>
        </v-row>
      </v-container>
    </v-container>

    <v-alert
      v-if="dailyLimitAlertShown"
      :value="true"
      style="
        border-radius: 0px;
        display: flex;
        align-items: center;
        background-color: #3a3a3a;
        color: #fff;
        width: 100%;
      "
      id="limit_reached"
      border="start"
      border-color="rgb(255 238 146)"
      dark
    >
      <v-row no-gutters>
        <!-- Only show the text in Desktop mode -->
        <!-- <v-col v-if="isMdAndUp" class="pt-2" cols="8">
          <span style="font-weight: bold"
            >You've reached your daily job match limit!</span
          >
        </v-col> -->

        <!-- Info Icon with Tooltip -->
        <v-col
          :cols="isMdAndUp ? 6 : 3"
          class="d-flex align-items-left justify-start"
        >
          <v-row no-gutters>
            <v-col sm="12" md="1">
              <v-btn
                icon
                elevation="0"
                color="transparent"
                style="cursor: pointer"
              >
                <v-icon color="rgb(255 234 135)">mdi-alert</v-icon>
                <v-tooltip
                  max-width="200px"
                  opacity="1"
                  activator="parent"
                  location="top"
                  id="limit_reached_alert"
                >
                  <h4 class="py-2">Daily limit reached</h4>

                  <p style="font-size: 0.9em">
                    You've hit your daily limit, I'll keep showing you the
                    freshest jobs, but not how you match up against each.
                  </p>
                  <p style="font-size: 0.9em" class="py-4">
                    Consider upgrading if you'd like me to keep showing how you
                    stack up against each opportunity.
                  </p>
                </v-tooltip>
              </v-btn>
            </v-col>
            <v-col v-if="isMdAndUp" id="daily_limit_reached">
              Daily limit reached
            </v-col>
          </v-row>
        </v-col>

        <!-- Close/Dismiss Button for Both Mobile and Desktop -->
        <v-col :cols="isMdAndUp ? 6 : 9">
          <v-row no-gutters>
            <v-col cols="9" class="text-right">
              <v-btn
                color="rgb(153 255 184)"
                class="ml-auto"
                size="small"
                @click="handleUpgrade"
                rounded="xl"
                elevation="2"
                variant="outlined"
                prepend-icon="mdi-arrow-up"
                style="margin-top: 11px; background-color: rgb(43 62 49)"
                to="/upgrade"
              >
                Upgrade
              </v-btn>
            </v-col>

            <v-col cols="3" class="text-right">
              <v-btn
                icon
                @click="handleDismiss"
                color="transparent"
                elevation="0"
              >
                <v-icon color="grey">mdi-close-circle</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-alert>

    <!-- <v-alert
      v-if="!can_generate_percents"
      style="border-radius: 0px; display: flex; align-items: center"
      border="start"
      border-color="rgb(162 78 255)"
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
    </v-alert> -->
    <h3 v-if="this.user_loaded" class="footer-controls px-3">
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
      <v-btn
        v-if="devToolsOpen && domReadyListenerAdded && initialized"
        icon="mdi-bug"
        elevation="0"
        color="transparent"
        size="x-small"
        class="mb-1 mr-1 float-right text-teal-accent-1"
        @click="enableDebug"
      ></v-btn>
    </h3>

    <!-- <div v-if="!isPremiumUser">
      <propeller-ad :shouldShowAd="true" />
    </div> -->

    <v-dialog v-model="debug.show" max-width="500px">
      <v-card>
        <v-card-title
          ><v-icon class="mr-2" color="teal-accent-1">mdi-bug</v-icon
          >Debug</v-card-title
        >
        <v-card-text>
          <v-text-field v-model="debug.url" label="URL" readonly>
            <template v-slot:append>
              <v-btn
                size="small"
                icon="mdi-content-copy"
                elevation="0"
                color="transparent"
                @click="copy(debug.url)"
              >
              </v-btn>
            </template>
          </v-text-field>
          <v-textarea
            v-if="debug.html"
            v-model="debug.html"
            rows="10"
            label="Page Source"
            readonly
          >
            <template v-slot:append>
              <v-btn
                size="small"
                icon="mdi-content-copy"
                elevation="0"
                color="transparent"
                @click="copy(debug.html)"
              >
              </v-btn>
            </template>
          </v-textarea>
          <v-container v-else class="text-center">
            <v-progress-circular indeterminate> </v-progress-circular>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import JobCard from "@/components/crawler/JobCard.vue";
// import PropellerAd from "@/components/advertising/PropellerAd.vue";
import { computed } from "vue";
import * as shared from "@/helpers/shared.js";
import * as linkedin from "@/helpers/linkedin.js";
import { linkedInSelectors } from "@/helpers/linkedin.selectors.js";
import { useDisplay } from "vuetify";

export default {
  props: {
    url: String,
    selectedJob: Object,
  },
  components: {
    JobCard,
    // PropellerAd,
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
      debug: {
        show: false,
        url: null,
        html: null,
      },
      isPremiumUser: false,
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
      screenHeight: 0,
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
      linkedInSelectors,
      limit_reached_alert_dismissed: false,
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
        // console.log(this.companyFilters, "onUserReloaded.companyFilters");

        await this.fetchPreloadPath();
        let guid = shared.getGuid();
        this.sessionID = guid;

        setTimeout(async () => {
          const webview = document.querySelector("webview");
          if (!webview) {
            // console.error("onUserReloaded.Webview is not initialized.");
            return;
          }
          webview.preload = this.preload;
          this.can_generate_percents =
            userdata.autopilot.usage.generate_percents;

          /* REMOVE THIS!!!! 
          this.can_generate_percents = false;
            */

          await this.startQueueProcessing();
        }, 1000);
      });
    }
    this.adjustLayout();
    // Add window resize event listener
    window.addEventListener("resize", this.adjustLayout);
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
  computed: {
    dailyLimitAlertShown() {
      return !this.can_generate_percents && !this.limit_reached_alert_dismissed;
    },
  },
  methods: {
    async copy(text) {
      await navigator.clipboard.writeText(text);
    },
    enableDebug() {
      this.debug.url = null;
      this.debug.html = null;

      const webview = this.$refs.jobsiteWebView;
      if (webview) {
        this.togglePause(true);
        this.debug.url = webview.src; // URL of the current webview content
        this.debug.show = true;

        webview
          .executeJavaScript("document.documentElement.outerHTML")
          .then((html) => {
            this.debug.html = html; // Full HTML source of the page
          })
          .catch((err) => {
            console.error("Error retrieving page source:", err);
          });
      }
    },
    handleDismiss() {
      this.limit_reached_alert_dismissed = true;
    },
    handleUpgrade() {
      this.$ga4Event("upgrade_click", { button_name: "upgrade_autopilot" });
    },
    async adjustLayout() {
      // Call the Electron API to get work area size
      // const { windowSize, workAreaSize, screenSize } =
      //   await window.electron.getWorkAreaSize();
      // console.log(windowSize, workAreaSize, screenSize, "adjustLayout");
      // Adjust layout elements based on height
      // const jobMaster = document.querySelector(".job-master");
      // const overlayContainer = document.querySelector(".overlay-container");
      // const footerControls = document.querySelector(".footer-controls");
      // // Calculate the difference between screen size and work area size
      // const taskbarHeight = screenSize.height - workAreaSize.height;
      // const isTaskbarVisible = taskbarHeight > 0; // Only consider significant differences as taskbar presence
      // // console.log(
      // //   `Taskbar height: ${taskbarHeight}, Taskbar visible: ${isTaskbarVisible}`
      // // );
      // let footerHeight = 60; // Default footer height
      // if (isTaskbarVisible) {
      //   // Add a buffer if the taskbar is visible (e.g., padding)
      //   footerHeight += taskbarHeight; // Use actual taskbar height
      // }
      // if (jobMaster) {
      //   jobMaster.style.height = `${windowSize.height - 64}px`; // Adjust for header height
      // }
      // if (overlayContainer) {
      //   overlayContainer.style.height = `${
      //     windowSize.height - (64 + footerHeight)
      //   }px`; // Adjust for header + footer + taskbar buffer
      // }
      // if (footerControls) {
      //   footerControls.style.height = `${footerHeight}px`; // Adjust footer height
      // }
    },
    onNewCompanyFilter(payload) {
      // alert("in JobSiteWebView.onNewCompanyFilter!");
      this.companyFilters.push(shared.transformCompanyFilter(payload));

      const webview = this.$refs.jobsiteWebView;
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
      const webview = this.$refs.jobsiteWebView;
      if (webview) {
        webview.removeEventListener("dom-ready", this.onDomReady);
        webview.removeEventListener("will-navigate", this.onWillNavigate);
        webview.removeEventListener("did-navigate", this.onDidNavigate);
      }
      window.removeEventListener("resize", this.adjustLayout);
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
        const webview = this.$refs.jobsiteWebView;
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
        const webview = this.$refs.jobsiteWebView;
        if (!webview) {
          console.error("Webview is not initialized.");
          return;
        }
        const loggedIn = await shared.checkSignInButton(
          webview,
          this.linkedInSelectors.signInSignals
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
      const webview = this.$refs.jobsiteWebView;
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
      try {
        webview
          .executeJavaScript(setPausedScript)
          .then(() => {
            if (!this.isPaused) {
              webview
                .executeJavaScript(continueProcessingScript)
                .catch((err) => {
                  console.error(
                    "Error executing continueProcessing script:",
                    err
                  );
                });

              if (this.continueProcessing) this.continueProcessing();
            }
          })
          .catch((err) => {
            console.error("Error setting window.isPaused:", err);
          });
      } catch (error) {
        console.error("Error setting window.isPaused:", error);
      }
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
          (this.working_job_count >= this.user.autopilot.usage.daily_limit &&
            this.user.autopilot.usage.upgrade_pack_count === 0);

        if (
          this.can_generate_percents &&
          this.working_job_count >= this.user.autopilot.usage.daily_limit &&
          this.user.autopilot.usage.upgrade_pack_count === 0
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
      const webview = this.$refs.jobsiteWebView;
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

      const webview = this.$refs.jobsiteWebView;
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
        //  console.log(this.jobQueue, "this.jobQueue");
        this.processingQueue = true;
        const jobData = this.jobQueue.shift();

        const delay =
          (this.jobs.length > 0 || this.jobQueue.length > 0) && !jobData.skipped
            ? this.jobDelay
            : 0;
        // console.log(delay, "delay");
        setTimeout(async () => {
          this.jobs.push(jobData);
          // console.log(this.jobs, "this.jobs");
          if (!jobData.dupe) {
            console.log(jobData, " > sending job to db");
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
      console.log("autopilot initialized");

      const webview = this.$refs.jobsiteWebView;
      if (!webview) {
        console.error("Webview is not initialized.");
        return;
      }
      try {
        //   console.log(this.preload, "this.preload");
        webview.preload = this.preload;
        this.updateWebviewJobs();
        await shared.delay(1000);

        try {
          await this.performSearch();
        } catch (error) {
          console.error("Failed to initiate autopilot:", error);
        }
      } catch (e) {
        console.log(e, "startAutopilot error");
      }
    },
    async performSearch() {
      const webview = this.$refs.jobsiteWebView;
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

        await linkedin.doSearch(this, webview, term);

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

    executeJavaScriptInWebview(script) {
      return new Promise((resolve, reject) => {
        const webview = this.$refs.jobsiteWebView;
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

<style>
#p_8439341 > div > div {
  background-color: red;
  width: 50vw !important;
  height: 50vh !important;
  position: fixed !important; /* Keeps it centered even on scroll */
  top: 50% !important;
  left: 50% !important;
  transform: translate(
    -50%,
    -50%
  ) !important; /* Center horizontally and vertically */
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: hidden !important; /* Clips any overflowing content */
  box-sizing: border-box !important; /* Ensures it respects set dimensions */
}

# _reached {
  padding-top: 14px;
  padding-left: 7px;
  font-size: 13px;
  font-weight: bold;
  color: #ffffff;
}
#limit_reached_alert > div {
  background-color: rgb(49 49 49);
  color: rgb(236 236 236);
}

#limit_reached .v-alert__content {
  width: 100%;
}
</style>

<style scoped>
#daily_limit_reached {
  font-weight: bold;
  font-size: 14px;
  color: #a4a4a4;
  padding-left: 7px;
  padding-top: 13px;
}

.tooltip-text {
  color: black !important;
  text-align: left;
  max-width: 200px;
  padding: 0px;
  white-space: normal;
}
/* .limit-warn {
  margin-bottom: 100px !important;
} */
.loading-message {
  font-size: 24px;
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 150px;
}
.footer-controls {
  border-top: 1px solid #4f4f4f;
  padding-top: 12px;
  height: 60px;
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
  height: calc(100vh - 124px);
  flex-direction: column;
}
.overlay-container.limit-warn {
  height: calc(100vh - 166px);
}

.webview.live.limit-warn {
  min-height: calc(100vh - 166px);
}
.job-master {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
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
