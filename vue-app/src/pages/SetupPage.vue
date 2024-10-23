<template>
  <v-container
    class="setup fill-height"
    :class="{ 'pa-3': step === 3 && !isMdAndUp }"
  >
    <v-row
      justify="center"
      :class="{ 'align-self-start': step === 1 }"
      class="fill-height"
    >
      <v-col cols="12" md="10" class="scrollable">
        <v-card elevation="0" color="transparent" class="fill-height">
          <v-card-text class="pa-0 fill-height">
            <!-- <div v-if="step === 1" style="margin-top: 10vh">
              <h1 class="text-left">✈️ Autopilot Setup</h1>
              <v-form>
                <p class="text-body-1 text-white mt-6 mb-10">
                  Please describe what you want from your job search in the box
                  below. This information will help me understand your
                  preferences and desired outcomes, allowing me to match you
                  with jobs that align closely with your goals.
                </p>
                <v-textarea
                  label="What do you want from your job search?"
                  v-model="jobSearchInput"
                  outlined
                  rows="8"
                  autofocus
                  :rules="[(v) => v.length <= 500 || 'Max 500 characters']"
                ></v-textarea>
                <v-btn
                  color="purple darken-2"
                  size="x-large"
                  rounded
                  class="float-right"
                  @click="submitJobSearchDetail"
                  >Submit</v-btn
                >
              </v-form>
            </div> -->
            <div
              v-if="step === 1 || step === 2"
              class="text-center d-flex flex-column justify-center align-center mb-16 fill-height"
            >
              <v-progress-circular
                :size="70"
                :width="7"
                color="grey"
                indeterminate
              ></v-progress-circular>
              <h1 class="pa-10 text-grey" style="line-height: 1">
                Generating your setup...
              </h1>
            </div>
            <div v-if="step === 3 && final_config">
              <h1 class="text-left pb-6" style="line-height: 1">
                Here's Your Setup
              </h1>
              <SetupView
                :config="final_config"
                :about_search="jobSearchInput"
                context="setup"
                @submit="submitSetup"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import SetupView from "@/components/common/SetupView.vue";

import { computed } from "vue";
import { useDisplay } from "vuetify";

export default {
  name: "SetupPage",
  layout: "blank",
  components: {
    SetupView,
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
      step: 1,
      jobSearchInput: "",
      //searchTerms: Array(10).fill(""),
      final_config: null,
    };
  },
  watch: {
    user(newU) {
      if (newU) {
        this.submitJobSearchDetail();
      }
    },
    step(newStep) {
      if (newStep === 2) {
        // setTimeout(() => {
        //   this.nextStep();
        // }, 10000); // 10 seconds delay
      }
    },
  },
  mounted() {
    console.log(this.user, "this.user");
    if (window.electron) {
      if (window.electron.onSetupCompleted) {
        window.electron.onSetupCompleted(async (setupData) => {
          //  console.log("Received new setup data in component!:", setupData);
          this.final_config = setupData;
          this.user.autopilot = setupData;
          this.$store.commit("setUser", this.user);
          this.nextStep();
        });
      }
    }
  },
  beforeUnmount() {
    if (window.electron && window.electron.removeSetupCompletedListener) {
      window.electron.removeSetupCompletedListener();
    }
  },
  methods: {
    submitJobSearchDetail() {
      const payload = {
        userid: this.user.userid,
        email: this.user.email,
        resume: this.user.resume.content,
        about: this.user.about,
        detail: this.jobSearchInput,
        about_search: this.jobSearchInput,
        max_applicants: 100,
        is_remote: true,
        is_hybrid: false,
        is_onsite: false,
        disable_salary: false,
        negative_keywords: [],
        company_filters: [],
      };
      //   console.log(payload, "payload");
      this.nextStep();
      // window.electron.onSetupCompleted((setupData) => {
      //   console.log("Setup completed with data:", setupData);
      //   // Handle the setup completion data if needed
      // });
      window.electron.sendSetupSaved(payload);
    },
    nextStep() {
      if (this.step < 3) {
        this.step++;
      }
    },
    submitSetup() {
      // Handle the final submission of the setup
      // console.log("Setup complete:", {
      //   jobSearchInput: this.jobSearchInput,
      //   searchTerms: searchTerms,
      // });
      window.location.href = "/";
    },
  },
  created() {
    this.$store.dispatch("loadUser");

    this.$store.watch(
      function (state) {
        return state.user;
      },
      (value) => {
        console.log(value, " setting this.user");
        //   this.user2 = value;
      },
      {
        deep: true, //add this if u need to watch object properties change etc.
      }
    );
  },
};
</script>

<style scoped>
.setup {
  padding: 20px;
  max-width: 100vw !important;
}
</style>

<style>
html.mac.setup #app {
  overflow-y: scroll !important;
}
html.win.setup {
  overflow-y: hidden !important;
}
</style>
