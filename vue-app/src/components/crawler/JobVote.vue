<template>
  <v-btn
    elevation="0"
    icon="mdi-thumb-up"
    size="x-small"
    color="transparent"
    :class="{ active: currentVote === true }"
    class="thumb-butt"
    @click="submitVote(true)"
  ></v-btn>
  <v-btn
    elevation="0"
    icon="mdi-thumb-down"
    size="x-small"
    color="transparent"
    :class="{ active: currentVote === false }"
    class="thumb-butt"
    @click="submitVote(false)"
  ></v-btn>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>
        <span class="headline">
          <img
            src="https://dt0651nvi2bbs.cloudfront.net/spence-face.png"
            alt="Spence"
            class="spence-image"
          />
          {{ dialogTitle }}</span
        >
      </v-card-title>
      <v-card-text>
        <v-textarea
          v-model="feedback"
          :label="feedbackLabel"
          maxlength="250"
          rows="4"
          autofocus
        ></v-textarea>
        <v-container class="text-right pa-2 pt-0">
          <v-btn
            color="red darken-1"
            size="small"
            class="mr-2"
            variant="tonal"
            @click="dialog = false"
            >Cancel</v-btn
          >
          <v-btn color="teal darken-1" size="small" @click="saveFeedback"
            >Submit</v-btn
          >
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "JobVote",
  props: {
    job: Object,
  },
  emits: ["jobVoted"],
  data() {
    return {
      dialog: false,
      feedback: "",
      currentVote: null,
      feedbackMaxLength: 250,
    };
  },
  watch: {
    job(newVal) {
      if (!newVal) return;
      if (newVal.vote === true) {
        this.currentVote = true;
      } else if (newVal.vote === false) {
        this.currentVote = false; // Corrected
      } else {
        this.currentVote = null;
      }
    },
  },
  mounted() {
    if (this.job && this.job.vote !== null) {
      //  console.log(this.job, "JobVote");
      this.currentVote = this.job.vote;
    }
  },
  computed: {
    dialogTitle() {
      return "Your feedback helps me improve";
    },
    feedbackLabel() {
      return this.currentVote
        ? "What did you like (optional)?"
        : "What didn't you like (optional)?";
    },
  },
  methods: {
    submitVote(vote) {
      //   console.log(vote, this.currentVote, "submitVote");
      if (this.currentVote != null) {
        this.currentVote = null;
        this.feedback = "";
      } else {
        this.currentVote = vote;
        this.dialog = true;
      }
      //     console.log(this.currentVote, "this.currentVote");

      if (this.currentVote != null) {
        this.dialog = true;
      }

      this.submitFeedback(false);
    },
    saveFeedback() {
      this.submitFeedback(true);
    },
    submitFeedback(manipulate_dialog) {
      // Handle vote and feedback submission
      const trimmedFeedback = this.feedback.trim();
      if (trimmedFeedback.length > this.feedbackMaxLength) {
        console.error(
          `Feedback exceeds the maximum length of ${this.feedbackMaxLength} characters.`
        );
        return;
      }
      const voteData = {
        jobId: this.job.guid ? this.job.guid : this.job.id,
        vote: this.currentVote,
        feedback: trimmedFeedback.length > 0 ? trimmedFeedback : null,
      };
      //   console.log(voteData, "voteData");
      window.electron.voteJob(voteData);
      this.$emit("jobVoted", voteData);
      // Add your API call here to save the voteData
      // Example API call using axios (make sure axios is imported)
      // axios.post('/api/vote', voteData)
      //   .then(response => {
      //     // handle success
      //     console.log(response.data);
      //   })
      //   .catch(error => {
      //     // handle error
      //     console.error(error);
      //   });

      if (manipulate_dialog) this.dialog = false;
      // this.feedback = "";
      // this.currentVote = null;
    },
  },
};
</script>

<style scoped>
.spence-image {
  width: 30px;
  height: 30px;
  margin-right: 10px;
  margin-left: 7px;
  border: 2px solid #fff1d8;
  border-radius: 50%;
  position: relative;
  top: 8px;
}

.thumb-butt {
  position: relative;
  top: 7px;
}
.thumb-butt.active {
  color: white !important;
  border: 1px solid #ffffff99;
}
</style>
