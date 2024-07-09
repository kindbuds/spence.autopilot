<template>
  <v-btn
    elevation="0"
    icon="mdi-heart"
    size="x-small"
    color="transparent"
    :class="{ active: currentSaved === true }"
    class="heart-butt"
    @click="save"
  ></v-btn>
</template>

<script>
export default {
  name: "JobSave",
  props: {
    job: Object,
  },
  emits: ["jobSaved"],
  data() {
    return {
      currentSaved: null,
    };
  },
  watch: {
    job(newVal) {
      // console.log(newVal, "JobSave.newVal");
      if (!newVal) return;
      if (newVal.saved) {
        this.currentSaved = true;
      } else {
        this.currentSaved = null;
      }
    },
  },
  mounted() {
    if (this.job && this.job.saved) {
      this.currentSaved = true;
    }
  },
  methods: {
    save() {
      if (this.currentSaved != null) {
        this.currentSaved = null;
      } else {
        this.currentSaved = true;
      }
      this.submitSave();
    },

    submitSave() {
      // Handle vote and feedback submission

      const saveData = {
        jobId: this.job.guid ? this.job.guid : this.job.id,
        saved: this.currentSaved,
      };
      console.log(saveData, "saveData");
      window.electron.userSaveJob(saveData);
      this.$emit("jobSaved", saveData);
    },
  },
};
</script>

<style scoped>
.heart-butt {
  position: relative;
  top: 7px;
}
.heart-butt.active {
  color: #ff8096 !important;
}
</style>
