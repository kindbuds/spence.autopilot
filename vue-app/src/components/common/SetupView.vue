<template>
  <v-container fluid class="pa-0">
    <v-alert
      v-if="context === 'setup'"
      color="teal-accent-1"
      class="mb-4"
      icon="$success"
      variant="tonal"
      text="Based on your input, below are your suggested settings. Feel free to adjust
      as needed."
      title="You're Setup!"
    >
      <!-- <div>
        <v-btn
          color="orange-accent-2"
          variant="elevated"
          class="mt-4"
          size="small"
          @click="$router.push('/live')"
        >
          <v-icon class="mr-1">mdi-play</v-icon>
          Go Live</v-btn
        >
      </div> -->
    </v-alert>
    <v-row>
      <v-col cols="12">
        <v-card
          elevation="0"
          :color="context === 'setup' ? 'transparent' : null"
        >
          <v-card-text class="pa-0" :class="!isMdAndUp ? 'pt-5' : 'pa-5'">
            <v-form ref="setupForm" v-model="isFormValid">
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
                    :disabled="localDisableSalary"
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
                    v-model="localRemote"
                    :hide-details="true"
                    color="teal-accent-2"
                    density="compact"
                  />
                  <v-checkbox
                    label="Hybrid"
                    v-model="localHybrid"
                    :hide-details="true"
                    density="compact"
                    color="teal-accent-2"
                  />
                  <v-checkbox
                    label="On-site"
                    v-model="localOnsite"
                    :hide-details="true"
                    density="compact"
                    color="teal-accent-2"
                  />
                  <v-alert
                    type="error"
                    color="red-lighten-3"
                    variant="tonal"
                    v-show="!isAtLeastOneSelected"
                    transition="scale-transition"
                    dismissible
                  >
                    At least one location type must be selected.
                  </v-alert>
                </v-col>
              </v-row>
              <v-row v-if="showLocation" class="pb-8">
                <v-col cols="12" md="4">
                  <div>
                    <h2>Search Location</h2>
                    <p class="text-subtitle-1 text-grey-lighten-1 pt-2">
                      Specify your preferred geographic location.
                    </p>
                  </div>
                </v-col>
                <v-col cols="12" md="8">
                  <v-row no-gutters>
                    <v-col cols="12">
                      <v-text-field
                        v-model="localLocation"
                        :rules="[
                          (v) => {
                            // Trim the input and check if it's not empty
                            const trimmed = v ? v.trim() : null;
                            const isValid = !isLocationRequired || !!trimmed;
                            console.log(
                              `Validating: '${trimmed}', isValid: ${isValid}`
                            );
                            return isValid || 'Location is required';
                          },
                        ]"
                        :disabled="!isLocationRequired"
                        class="mb-2"
                      ></v-text-field>

                      <v-alert variant="tonal" color="grey-darken-3">
                        <v-checkbox
                          v-model="localDisableSalary"
                          label="Disable salary filter?"
                          :hide-details="true"
                          class="text-white font-weight-bold"
                        ></v-checkbox>
                        <v-container
                          class="text-grey-lighten-1 text-subtitle-1 pt-0"
                        >
                          When you specify a geographic location, you risk
                          salary ranges not being required in your location and
                          receiving very few results. Disabling will apply to
                          onsite, hybrid, and remote searches.
                        </v-container>
                      </v-alert>
                    </v-col>
                  </v-row>
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
                        density="compact"
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
                        density="compact"
                        color="teal-accent-2"
                      />
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
              <v-row class="pb-8">
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
              <v-row v-if="context !== 'setup'" class="pb-8">
                <v-col cols="12" md="4">
                  <div>
                    <h2>Negative Keywords</h2>
                    <p class="text-subtitle-1 text-grey-lighten-1 pt-2">
                      Filter out job post titles and description by keyword.
                    </p>
                  </div>
                </v-col>
                <v-col cols="12" md="8">
                  <v-btn
                    @click="addNegativeKeyword"
                    class="mb-4"
                    color="teal-accent-2"
                    size="small"
                    prepend-icon="mdi-plus"
                    >Add</v-btn
                  >
                  <v-row
                    v-for="(kw, index) in paginatedKeywords"
                    :key="index"
                    class="mb-2"
                    no-gutters
                  >
                    <v-col cols="12">
                      <v-text-field
                        v-model="kw.keyword"
                        :ref="`keywordInput${index}`"
                        label="Keyword"
                        dense
                        :hide-details="true"
                      ></v-text-field>
                    </v-col>
                    <v-col
                      cols="12"
                      class="d-flex align-center justify-space-between"
                    >
                      <span class="text-subtitle-1 text-grey-darken-1">
                        Applies to:</span
                      >
                      <v-radio-group
                        v-model="kw.applies_to"
                        inline
                        :hide-details="true"
                        class="flex-grow-1"
                      >
                        <v-radio label="Title" value="title"></v-radio>
                        <v-radio
                          label="Description"
                          value="description"
                        ></v-radio>
                        <v-radio label="Both" value="both"></v-radio>
                      </v-radio-group>
                      <v-btn
                        icon
                        elevation="0"
                        color="transparent"
                        size="x-small"
                        class="text-red"
                        @click="removeNegativeKeyword(index)"
                      >
                        <v-icon>mdi-trash-can-outline</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                  <v-container v-if="totalNegativePages > 1" class="pa-0 pt-2">
                    <v-btn
                      elevation="0"
                      variant="outlined"
                      icon="mdi-chevron-left"
                      size="x-small"
                      class="mr-2"
                      @click="
                        negative.currentPage > 1
                          ? negative.currentPage--
                          : negative.currentPage
                      "
                      :disabled="negative.currentPage <= 1"
                    >
                    </v-btn>
                    <span class="text-grey-lighten-1"
                      >Page {{ negative.currentPage }} of
                      {{ totalNegativePages }}</span
                    >
                    <v-btn
                      elevation="0"
                      variant="outlined"
                      icon="mdi-chevron-right"
                      size="x-small"
                      class="ml-2"
                      @click="
                        negative.currentPage < totalNegativePages
                          ? negative.currentPage++
                          : negative.currentPage
                      "
                      :disabled="negative.currentPage >= totalNegativePages"
                    >
                    </v-btn>
                  </v-container>
                </v-col>
              </v-row>
              <v-row
                v-if="context !== 'setup' && localCompanyFilters.length > 0"
                class="pb-8"
              >
                <v-col cols="12" md="4">
                  <div>
                    <h2>Company Filters</h2>
                    <p class="text-subtitle-1 text-grey-lighten-1 pt-2">
                      Manage your company filters.
                    </p>
                  </div>
                </v-col>
                <v-col cols="12" md="8">
                  <v-list>
                    <v-list-item
                      v-for="(filter, index) in paginatedCompanyFilters"
                      :key="filter.company_name"
                      class="text-body-1"
                    >
                      <v-row no-gutters>
                        <v-col class="ma-0 pa-0" cols="10">
                          {{ filter.company_name }}
                        </v-col>
                        <v-col class="ma-0 pa-0" cols="2">
                          <v-btn
                            icon
                            elevation="0"
                            color="transparent"
                            size="x-small"
                            class="text-red"
                            @click="removeCompanyFilter(index)"
                          >
                            <v-icon>mdi-trash-can-outline</v-icon>
                          </v-btn>
                        </v-col>
                      </v-row>
                    </v-list-item>
                  </v-list>
                  <v-container v-if="totalCompanyPages > 1" class="pa-0 pt-2">
                    <v-btn
                      elevation="0"
                      variant="outlined"
                      icon="mdi-chevron-left"
                      size="x-small"
                      class="mr-2"
                      @click="
                        company.currentPage > 1
                          ? company.currentPage--
                          : company.currentPage
                      "
                      :disabled="company.currentPage <= 1"
                    >
                    </v-btn>
                    <span class="text-grey-lighten-1"
                      >Page {{ company.currentPage }} of
                      {{ totalCompanyPages }}</span
                    >
                    <v-btn
                      elevation="0"
                      variant="outlined"
                      icon="mdi-chevron-right"
                      size="x-small"
                      class="ml-2"
                      @click="
                        company.currentPage < totalCompanyPages
                          ? company.currentPage++
                          : company.currentPage
                      "
                      :disabled="company.currentPage >= totalCompanyPages"
                    >
                    </v-btn>
                  </v-container>
                </v-col>
              </v-row>
              <v-row
                v-if="context !== 'setup' && user && user.version_number"
                class="pb-8"
              >
                <v-col cols="12" md="4">
                  <div>
                    <h2>Developer Tools</h2>
                    <p class="text-subtitle-1 text-grey-lighten-1 pt-2">
                      To help in debugging any issues.
                    </p>
                  </div>
                </v-col>
                <v-col cols="12" md="8">
                  <v-btn
                    @click="toggleDevTools"
                    :color="devToolsOpen ? 'grey-darken-3' : 'white'"
                    size="small"
                    :prepend-icon="'mdi-xml'"
                  >
                    {{ devToolsOpen ? "Close Tools" : "Open Tools" }}
                  </v-btn>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" class="text-right mb-12">
                  <v-btn
                    color="orange"
                    light
                    :loading="loading"
                    @click="submitForm"
                    :disabled="!isFormValid"
                    :text="context === 'setup' ? 'Get Started' : 'Save'"
                  >
                  </v-btn>
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
import * as shared from "@/helpers/shared.js";

export default {
  name: "SetupView",
  emits: ["submit"],
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
      isFormValid: false,
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
      localUsage: this.config.usage,
      localRemote: this.config.is_remote,
      localHybrid: this.config.is_hybrid,
      localOnsite: this.config.is_onsite,
      localLocation: this.config.location,
      localDisableSalary: this.config.disable_salary,
      localNegativeKeywords: this.config.negative_keywords,
      localCompanyFilters: this.config.company_filters,
      showTicks: [20000, 100000, 200000],
      juniorExperienceLevels: ["Internship", "Entry", "Associate"],
      seniorExperienceLevels: ["Mid-Senior", "Director", "Executive"],
      negative: {
        currentPage: 1,
        perPage: 5,
      },
      company: {
        currentPage: 1,
        perPage: 5,
      },
    };
  },
  mounted() {
    this.isFormValid = false;
    // console.log(this.isFormValid, "this.isFormValid");
    // console.log(this.config, "this.config");
    //  this.user.autopilot =
  },
  computed: {
    paginatedCompanyFilters() {
      const start = (this.company.currentPage - 1) * this.company.perPage;
      const end = start + this.company.perPage;
      return this.localCompanyFilters.slice(start, end);
    },
    totalCompanyPages() {
      return Math.ceil(this.localCompanyFilters.length / this.company.perPage);
    },
    totalNegativePages() {
      return Math.ceil(
        this.localNegativeKeywords.length / this.negative.perPage
      );
    },
    paginatedKeywords() {
      let start = (this.negative.currentPage - 1) * this.negative.perPage;
      let end = start + this.negative.perPage;
      return this.localNegativeKeywords.slice(start, end);
    },
    isAtLeastOneSelected() {
      return this.localRemote || this.localHybrid || this.localOnsite;
    },
    showLocation() {
      if (!this.config) return false;

      return this.localHybrid || this.localOnsite;
    },
    isLocationRequired() {
      return this.localHybrid || this.localOnsite;
    },
    formattedSalary() {
      return `$${this.localSalary
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    },
  },
  watch: {
    localSearchTerms: {
      async handler() {
        await this.validateForm();
      },
      deep: true, // Add this line to watch for deep changes
    },
    async localExperienceLevels() {
      await this.validateForm();
    },
    async localSalary() {
      await this.validateForm();
    },
    async localMaxApplicants() {
      await this.validateForm();
    },

    async localRemote() {
      await this.validateForm();
    },
    async localHybrid(newVal) {
      if (!newVal && !this.localOnsite) {
        this.localLocation = "";
        this.localDisableSalary = false;
      }
      await this.validateForm();
    },
    async localOnsite(newVal) {
      if (!newVal && !this.localHybrid) {
        this.localLocation = "";
        this.localDisableSalary = false;
      }
      await this.validateForm();
    },
    async localLocation() {
      await this.validateForm();
    },
    async localDisableSalary() {
      await this.validateForm();
    },
    config: {
      handler(newVal) {
        this.localSearchTerms = [...newVal.searches];
        this.localSalary = newVal.salary;
        this.localMaxApplicants = newVal.max_applicants;
        this.localExperienceLevels = newVal.experience_levels;
        this.localRemote = newVal.is_remote; // Add this line if remote is part of config
        this.localHybrid = newVal.is_hybrid;
        this.localOnsite = newVal.is_onsite;
        this.localLocation = newVal.location;
        this.localDisableSalary = newVal.disable_salary;
        this.localNegativeKeywords = newVal.negative_keywords;
        this.localCompanyFilters = newVal.company_filters;
      },
      deep: true,
    },
  },
  methods: {
    // openDevTools() {
    //   window.electron.openDevTools();
    // },
    removeCompanyFilter(index) {
      const globalIndex =
        (this.company.currentPage - 1) * this.company.perPage + index;
      this.localCompanyFilters.splice(globalIndex, 1); // Adjust index to global and remove

      // After removal, check if there are no items left on the current page
      if (
        this.paginatedCompanyFilters.length === 0 &&
        this.company.currentPage > 1
      ) {
        // If the current page is not the first page and it's empty, move to the previous page
        this.company.currentPage--;
      }
    },

    addNegativeKeyword() {
      this.negative.currentPage = 1;
      this.localNegativeKeywords.unshift({ keyword: "", applies_to: "both" });
      this.$nextTick(() => {
        console.log(this.$refs, "this.$refs");
        // const inputRef = `keywordInput0`; // Since it's always added at the top, index is 0
        if (this.$refs.keywordInput0) {
          this.$refs.keywordInput0[0].focus();
        }
      });
    },
    removeNegativeKeyword(index) {
      // Calculate the global index in the full list
      const globalIndex =
        (this.negative.currentPage - 1) * this.negative.perPage + index;
      this.localNegativeKeywords.splice(globalIndex, 1); // Remove the item using the global index

      // After removal, check if there are no items left on the current page and there's another page to go back to
      if (
        this.paginatedKeywords.length === 0 &&
        this.negative.currentPage > 1
      ) {
        this.negative.currentPage--; // Move back one page if the current page is empty
      }
    },
    async validateForm() {
      console.log("1Form Valid Before Validation:", this.isFormValid);
      const validObj = await this.$refs.setupForm.validate();
      this.isFormValid = validObj.valid && this.isAtLeastOneSelected;
      console.log("1Form Valid After Validation:", this.isFormValid);
    },
    async submitForm() {
      console.log("2Form Valid Before Validation:", this.isFormValid);
      const validObj = await this.$refs.setupForm.validate();
      this.isFormValid = validObj.valid && this.isAtLeastOneSelected;
      console.log("2Form Valid After Validation:", this.isFormValid);
      if (!this.isFormValid) return;

      this.loading = true;

      try {
        const trimmedSearchTerms = this.localSearchTerms
          .filter((term) => term !== null && term !== undefined)
          .map((term) => term.trim())
          .filter((term) => term !== "");

        const processedKeywords = shared.processKeywords(
          this.localNegativeKeywords
        );

        const config = {
          guid: this.user.userid,
          salary: this.localSalary,
          experience_levels: this.localExperienceLevels,
          searches: trimmedSearchTerms,
          about_search: this.localAboutSearch,
          max_applicants: this.localMaxApplicants,
          location: this.localLocation,
          is_remote: this.localRemote,
          is_hybrid: this.localHybrid,
          is_onsite: this.localOnsite,
          disable_salary: this.localDisableSalary,
          negative_keywords: processedKeywords,
          company_filters: this.localCompanyFilters,
          usage: this.localUsage,
        };
        console.log(config, "submitForm.config");
        this.$emit("submit", config);
        this.user.autopilot = config;
        window.electron.saveSettings(JSON.parse(JSON.stringify(config))); // Ensure the object is cloneable

        setTimeout(async () => {
          this.loading = false;
          // await this.validateForm();
          this.isFormValid = false;
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
/* .negative-keyword-container
{

} */

.negative-keyword-container .v-radio-group {
  max-width: calc(100% - 50px); /* Leave space for remove button */
}
.negative-keyword-container .v-btn {
  min-width: 40px; /* Ensures the remove button does not take too much space */
}

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
