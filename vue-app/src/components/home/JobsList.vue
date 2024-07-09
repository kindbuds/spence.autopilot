<template>
  <v-card elevation="0" v-if="jobs && jobs.length > 0" density="compact">
    <v-card-title class="mb-2">
      <span class="text-overline text-grey">{{ headline }}</span>
    </v-card-title>
    <v-card-text>
      <v-list class="mb-4" density="compact">
        <v-list-item
          v-for="(match, index) in jobs"
          :key="index"
          class="top-match pa-0"
          :to="`/jobs?show=${match.guid}`"
          link
        >
          <v-list-item-title>
            <div style="display: flex; justify-content: space-between">
              <span
                style="
                  flex: 1;
                  text-overflow: ellipsis;
                  overflow: hidden;
                  white-space: nowrap;
                "
                class="text-white"
                >{{ match.title }}</span
              >
              <span
                class="pl-4 font-weight-bold"
                :class="shared.lowMidHigh(match.percentage)"
                >{{ Math.floor(match.percentage) }}%</span
              >
            </div>
          </v-list-item-title>
          <v-list-item-subtitle
            class="pb-1"
            style="opacity: 1; color: #e4aa73"
            >{{ match.employer_name }}</v-list-item-subtitle
          >
          <div class="text-grey">
            {{ formatDate(match.added) }}
          </div>
          <v-divider
            v-if="index != jobs.length - 1"
            class="pb-2 mt-2"
          ></v-divider>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
import { format } from "date-fns";
import * as shared from "@/helpers/shared.js";
export default {
  props: {
    jobs: {
      type: Array,
      required: true,
    },
    headline: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      shared: shared,
    };
  },
  methods: {
    formatDate(date) {
      return format(new Date(date), "M/dd/yy");
    },
  },
};
</script>

<style scoped>
</style>