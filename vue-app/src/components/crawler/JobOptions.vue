<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :nudge-width="200"
    width="275px"
    offset-y
  >
    <!-- Activator -->
    <template v-slot:activator="{ props }">
      <v-btn
        elevation="0"
        icon="mdi-dots-vertical"
        size="x-small"
        color="transparent"
        class="thumb-butt"
        v-bind="props"
      ></v-btn>
    </template>

    <!-- Menu Content -->

    <v-list color="#1d1d1d">
      <v-list-item :key="`nkw`">
        <v-btn
          text
          block
          elevation="0"
          @click="show_company_detail = false"
          prepend-icon="mdi-minus"
        >
          Negative Keyword
        </v-btn>
        <v-container v-if="!show_company_detail" class="ma-0 pa-0 py-3">
          <v-form ref="kw_form">
            <v-row>
              <v-col cols="9" class="pr-0 pl-3">
                <v-text-field
                  ref="negativeKeywordField"
                  v-model="negativeKeyword"
                  label="Negative Keyword"
                  density="compact"
                  hide-details
                  autofocus
                  validate-on="submit"
                  @keyup.enter="addNegativeKeyword"
                  :rules="negativeKeywordRules"
                ></v-text-field>
              </v-col>
              <v-col cols="3" class="text-center pa-0 pt-4">
                <v-btn
                  icon="mdi-plus"
                  size="x-small"
                  color="teal-accent-2"
                  elevation="0"
                  @click="addNegativeKeyword"
                  :loading="saving_kw"
                ></v-btn>
              </v-col>
            </v-row>
            <v-row no-gutters class="mt-2">
              <v-col cols="12">
                <v-radio-group
                  label="Applies to:"
                  v-model="applies_to"
                  inline
                  :hide-details="true"
                  class="flex-grow-1 radio-applies"
                  density="compact"
                  x-small
                >
                  <v-radio
                    label="Title"
                    value="title"
                    density="compact"
                    class="radio-applies mr-2"
                  ></v-radio>
                  <v-radio
                    label="Description"
                    value="description"
                    class="radio-applies mr-2"
                    x-small
                  ></v-radio>
                  <v-radio
                    label="Both"
                    value="both"
                    density="compact"
                    class="radio-applies"
                  ></v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
          </v-form>
        </v-container>
      </v-list-item>
      <v-list-item
        :key="`company`"
        class="pt-3 mt-2"
        style="border-top: 1px solid grey"
      >
        <v-btn
          text
          block
          elevation="0"
          @click="show_company_detail = true"
          :class="{ filtered: isCompanyFiltered }"
          :prepend-icon="isCompanyFiltered ? 'mdi-check' : 'mdi-filter'"
        >
          Filter Company
        </v-btn>
        <v-container
          v-if="show_company_detail"
          class="pa-0 ma-0 py-3"
          :class="{ 'pb-2': companyFilter }"
        >
          <span class="text-grey text-caption">Filter: </span>
          <span class="text-orange-accent-1">{{ getEmployer }}</span>
          <v-form ref="form" v-model="valid">
            <v-container class="ma-0 pa-0">
              <v-checkbox
                v-if="!companyFilter"
                v-model="isCompanyFlagged"
                @change="toggleFlagReason(isCompanyFlagged)"
                hide-details
                :disabled="isCompanyFilterSaved"
              >
                <template v-slot:label>
                  <div class="text-subtitle-2">
                    <v-icon color="red-accent-2" size="small">mdi-flag</v-icon>
                    Report Scam
                  </div>
                </template>
              </v-checkbox>
              <v-container v-if="showFlagReason" class="pa-0">
                <p
                  v-if="!companyFilter"
                  class="text-caption text-grey-lighten-1 pb-3"
                >
                  Explain why you believe this company is involved in fraudulent
                  job posts or activities. Your report helps protect our
                  community.
                </p>
                <v-textarea
                  v-model="flagReason"
                  :rules="flagReasonRules"
                  :disabled="isCompanyFilterSaved"
                  label="Reason for Reporting"
                  outlined
                  dense
                  autofocus
                  :auto-grow="true"
                  :class="{ 'pt-2': companyFilter && companyFilter.is_flagged }"
                  :hide-details="companyFilter && companyFilter.is_flagged"
                ></v-textarea>
              </v-container>
              <v-container
                class="text-right ma-0 pa-0"
                v-if="!isCompanyFilterSaved"
              >
                <v-btn
                  small
                  color="teal-accent-2"
                  size="small"
                  @click="submitFlag"
                  :disabled="
                    isCompanyFlagged &&
                    (!flagReason.trim() ||
                      flagReason.trim().length > 500 ||
                      flagReason.trim().length < 25)
                  "
                  :loading="saving_company_filter"
                >
                  Save
                </v-btn>
              </v-container>
            </v-container>
          </v-form>
          <v-container
            v-if="companyFilter"
            class="text-white text-caption pa-0 pt-3"
          >
            <v-icon color="teal-accent-2">mdi-check</v-icon>
            Company filtered
          </v-container>
        </v-container>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import * as shared from "@/helpers/shared.js";
export default {
  name: "JobOptions",
  emits: ["newCompanyFilter"],
  props: {
    job: Object,
  },
  data() {
    return {
      valid: false,
      menu: false,
      negativeKeyword: "",
      applies_to: "both",
      saving_kw: false,
      saving_company_filter: false,
      show_company_detail: false,
      showFlagReason: false,
      isCompanyFiltered: false,
      isCompanyFlagged: false,
      isCompanyFilterSaved: false,
      flagReason: "",
      flagReasonRules: [
        (v) => !!v.trim() || "A reason is required", // Checks for non-empty input after trimming spaces
        (v) =>
          (v && v.trim().length >= 25) ||
          "Reason must be at least 25 characters",
        (v) =>
          (v && v.trim().length <= 500) ||
          "Reason must be less than 500 characters", // Ensure length is within limit
        (v) => /\w/.test(v) || "Reason must include alphabetic characters", // Checks for at least one word character (letter or number)
        (v) => !/^[0-9]+$/.test(v.trim()) || "Reason cannot be only numbers", // Ensures it's not just numbers
        (v) =>
          !/^[^a-zA-Z0-9]+$/.test(v.trim()) ||
          "Reason cannot be only special characters", // Ensures it's not just special characters
      ],
      negativeKeywordRules: [
        (v) => !!v.trim() || "A keyword is required.", // Checks for non-empty input after trimming spaces
        (v) => v.trim().length >= 3 || "Keyword must be at least 3 characters.", // Ensures input length is at least 3 characters
        (v) =>
          v.trim().length <= 50 || "Keyword must not exceed 50 characters.", // Ensures input length does not exceed 50 characters
        (v) =>
          (/^[a-zA-Z0-9\s]*$/.test(v) && /[a-zA-Z]/.test(v)) ||
          "Keyword cannot be just special characters or numbers.", // Ensures input is not just numbers or special characters and includes alphabetic characters
      ],
      companyFilter: null,
    };
  },
  watch: {},
  mounted() {
    // console.log(
    //   this.user.autopilot.company_filters,
    //   "this.user.autopilot.company_filters"
    // );
    this.companyFilter = this.matchingCompanyFilter;
    if (this.companyFilter) {
      this.isCompanyFiltered = true;
      this.isCompanyFilterSaved = true;
      this.isCompanyFlagged = this.companyFilter.is_flagged;
      this.flagReason = this.companyFilter.flag_reason;
      this.showFlagReason = this.isCompanyFlagged;
      // this.show_company_detail = true;
    }
  },
  computed: {
    matchingCompanyFilter() {
      if (!this.job || !this.user.autopilot.company_filters) {
        return null;
      }

      const employerName = this.job.employer_name
        ? this.job.employer_name.trim().toLowerCase()
        : "";
      return this.user.autopilot.company_filters.find(
        (filter) => filter.company_name_lower === employerName
      );
    },
    getEmployer() {
      if (!this.job) return;
      return this.job.employer_name
        ? this.job.employer_name.trim()
        : this.job.employer.trim();
    },
  },
  methods: {
    submitFlag() {
      if (this.valid) {
        console.log(this.job, this.flagReason, "submitFlag");
        this.saving_company_filter = true;
        const payload = {
          company: this.getEmployer,
          flagged: this.isCompanyFlagged,
          reason: this.isCompanyFlagged ? this.flagReason.trim() : null,
        };
        window.electron.addCompanyFilter(payload);
        this.$emit("newCompanyFilter", payload);
        console.log("Submitted:", this.flagReason);
        setTimeout(() => {
          this.saving_company_filter = false;
          this.isCompanyFilterSaved = true;
        }, 1000);
      }
    },
    toggleFlagReason(isFlagged) {
      this.showFlagReason = isFlagged;
    },

    openFilterCompanyModal() {
      this.show_company_detail = !this.show_company_detail;
    },
    async addNegativeKeyword() {
      const validationErrors = await this.$refs.negativeKeywordField.validate();
      if (validationErrors.length === 0) {
        console.log("Adding keyword:", this.negativeKeyword);
        this.saving_kw = true;
        const processedKeywords = shared.processKeywords([
          { keyword: this.negativeKeyword, applies_to: this.applies_to },
        ]);
        console.log(processedKeywords, "processedKeywords");

        if (processedKeywords.length > 0) {
          window.electron.addNegativeKeyword(processedKeywords[0]);
        }

        setTimeout(() => {
          this.negativeKeyword = ""; // Clear the input after adding
          this.applies_to = "both";
          this.saving_kw = false;
        }, 1000);
      } else {
        console.log("Validation failed");
      }
    },
  },
};
</script>

<style scoped>
.radio-applies,
.v-label {
  font-size: 13px !important;
}
.thumb-butt {
  position: relative;
  top: 7px;
}
</style>

<style>
.filtered i {
  color: #64ffda;
}
.radio-applies .v-selection-control .v-label {
  font-weight: normal;
  color: inherit;
  margin-top: 0px;
}
.radio-applies .v-label {
  margin-inline-start: 0px;
  margin-top: 10px;
  font-size: 13px !important;
  font-weight: bold;
  color: #cccccc;
}
</style>
