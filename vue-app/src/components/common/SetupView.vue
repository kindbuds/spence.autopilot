<template>
  <v-container fluid class="pa-0">
    <v-alert
      v-if="context === 'setup'"
      color="teal-accent-1"
      class="mb-4"
      icon="$success"
      variant="tonal"
      text="Based on your input below are your suggested settings. Feel free to adjust
      as needed."
      title="You're Setup!"
    >
      <div>
        <v-btn
          color="orange-accent-2"
          variant="tonal"
          class="mt-4"
          size="small"
          @click="$router.push('/live')"
        >
          <v-icon class="mr-1">mdi-play</v-icon>
          Go Live</v-btn
        >
      </div>
    </v-alert>
    <v-row>
      <v-col cols="12">
        <v-card elevation="0">
          <v-card-text class="pa-0" :class="!isMdAndUp ? 'pt-5' : 'pa-5'">
            <v-form ref="setupForm">
              <v-row class="pb-8">
                <v-col cols="12" md="4">
                  <div>
                    <h2>Minimum Salary</h2>
                    <p class="text-subtitle-1 text-grey-lighten-1 pt-2">
                      Set your desired minimum salary.
                    </p>
                  </div>
                </v-col>
                <v-col cols="12" md="8">
                  <v-slider
                    v-model="localSalary"
                    :min="20000"
                    :max="200000"
                    :step="20000"
                    :ticks="[
                      20000, 40000, 60000, 80000, 100000, 120000, 140000,
                      160000, 180000, 200000,
                    ]"
                    tick-size="4"
                    :label="formattedSalary"
                    track-color="teal-accent-2"
                    color="black"
                    show-ticks="always"
                    thumb-color="teal-accent-2"
                    :hide-details="true"
                  >
                    <template v-slot:tick-label="{ tick }">
                      <span
                        v-if="showTicks.includes(tick.value)"
                        class="tick-label"
                        >${{
                          tick.value
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }}
                      </span>
                    </template>
                  </v-slider>
                </v-col>
              </v-row>
              <v-row class="pb-8">
                <v-col cols="12" md="4">
                  <div>
                    <h2>Max Applicants</h2>
                    <p class="text-subtitle-1 text-grey-lighten-1 pt-2">
                      Maximum allowable applicant count.
                    </p>
                  </div>
                </v-col>
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="localMaxApplicants"
                    type="number"
                    :rules="[
                      (v) => (v && v > 0) || 'Must be a positive number',
                    ]"
                    min="1"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row class="pb-8">
                <v-col cols="12" md="4">
                  <div>
                    <h2>Locations</h2>
                    <p class="text-subtitle-1 text-grey-lighten-1 pt-2">
                      Specify your preferred work locations.
                    </p>
                  </div>
                </v-col>
                <v-col cols="12" md="8">
                  <v-checkbox
                    label="Remote"
                    :disabled="true"
                    v-model="localRemote"
                    :hide-details="true"
                    color="teal-accent-2"
                  />
                  <v-alert>Location support coming soon.</v-alert>
                </v-col>
              </v-row>
              <v-row class="pb-8">
                <v-col cols="12" md="4">
                  <div>
                    <h2>Experience Levels</h2>
                    <p class="text-subtitle-1 text-grey-lighten-1 pt-2">
                      Specify your experience levels.
                    </p>
                  </div>
                </v-col>
                <v-col cols="12" md="8">
                  <v-row no-gutters>
                    <v-col cols="12" md="6">
                      <v-checkbox
                        v-for="(level, index) in juniorExperienceLevels"
                        :key="index"
                        :label="level"
                        v-model="localExperienceLevels"
                        :value="level"
                        :hide-details="true"
                        color="teal-accent-2"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-checkbox
                        v-for="(level, index) in seniorExperienceLevels"
                        :key="index"
                        :label="level"
                        v-model="localExperienceLevels"
                        :value="level"
                        :hide-details="true"
                        color="teal-accent-2"
                      />
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" md="4">
                  <div>
                    <h2>Searches</h2>
                    <p class="text-subtitle-1 text-grey-lighten-1 pt-2">
                      I will search these terms.
                    </p>
                  </div>
                </v-col>
                <v-col cols="12" md="8">
                  <v-row>
                    <v-col v-for="index in 10" :key="index" cols="12" md="6">
                      <v-text-field
                        v-model="localSearchTerms[index - 1]"
                        :label="`Term #${index}`"
                        variant="underlined"
                        color="teal-accent-2"
                        clearable
                        density="comfortable"
                        x-small
                        :hide-details="true"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" class="text-right">
                  <v-btn
                    color="orange"
                    light
                    :loading="loading"
                    @click="submitForm"
                    :disabled="!isFormValid"
                    >Save</v-btn
                  >
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { computed } from "vue";
import { useDisplay } from "vuetify";

export default {
  name: "SetupView",
  props: {
    config: {
      type: Object,
      required: true,
    },
    context: {
      type: String,
      required: true,
    },
    about_search: {
      type: String,
      required: true,
    },
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
      loading: false,
      localSearchTerms: [...this.config.searches],
      localSalary: this.config.salary,
      localMaxApplicants: this.config.max_applicants,
      localAboutSearch: this.about_search
        ? this.about_search
        : this.config.about_search,
      localExperienceLevels: this.config.experience_levels
        ? [...this.config.experience_levels]
        : [],
      localRemote: true,
      showTicks: [20000, 100000, 200000],
      juniorExperienceLevels: ["Internship", "Entry", "Associate"],
      seniorExperienceLevels: ["Mid-Senior", "Director", "Executive"],
      isFormValid: false,
    };
  },
  mounted() {
    // console.log(this.config, "this.config");
    //  this.user.autopilot =
  },
  computed: {
    formattedSalary() {
      return `$${this.localSalary
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    },
  },
  watch: {
    localSearchTerms: {
      handler() {
        this.validateForm();
      },
      deep: true, // Add this line to watch for deep changes
    },
    localExperienceLevels() {
      this.validateForm();
    },
    localSalary() {
      this.validateForm();
    },
    localMaxApplicants() {
      this.validateForm();
    },
    config: {
      handler(newVal) {
        this.localSearchTerms = [...newVal.searches];
        this.localSalary = newVal.salary;
        this.localMaxApplicants = newVal.max_applicants;
        this.localExperienceLevels = newVal.experience_levels;
        this.localRemote = newVal.remote || true; // Add this line if remote is part of config
      },
      deep: true,
    },
  },
  methods: {
    validateForm() {
      this.$refs.setupForm.validate();
      this.isFormValid = this.$refs.setupForm.validate();
    },
    async submitForm() {
      this.loading = true;

      try {
        const trimmedSearchTerms = this.localSearchTerms
          .filter((term) => term !== null && term !== undefined)
          .map((term) => term.trim())
          .filter((term) => term !== "");

        const config = {
          guid: this.user.userid,
          salary: this.localSalary,
          experience_levels: this.localExperienceLevels,
          searches: trimmedSearchTerms,
          about_search: this.localAboutSearch,
          max_applicants: this.localMaxApplicants,
        };
        //  console.log(config, "config");
        this.$emit("submit", config);
        this.user.autopilot = config;
        window.electron.saveSettings(JSON.parse(JSON.stringify(config))); // Ensure the object is cloneable

        setTimeout(() => {
          this.loading = false;
        }, 1500);
      } catch (error) {
        console.error("Error calling save_config API:", error);
      }

      setTimeout(() => {
        this.loading = false;
      }, 2000);
    },
  },
};
</script>

<style>
/* .v-slider-track__fill {
  opacity: 0;
} */
.tick-label {
  font-size: 12px;
  color: wheat !important;
  transform: translateX(-50%);
}
.v-slider__label {
  margin-inline-end: 12px;
  font-size: 20px;
  font-weight: bold;
  color: white !important;
  opacity: 1;
  border: 1px solid #55d9ba;
  padding: 5px;
  border-radius: 6px;
  text-align: center; /* Center text horizontally */
  display: flex; /* Use flexbox for centering */
  justify-content: center; /* Center text horizontally */
  align-items: center; /* Center text vertically */
  min-width: 100px;
}
</style>
