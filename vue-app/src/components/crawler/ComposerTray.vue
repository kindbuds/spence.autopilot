<template>
  <div>
    <v-slide-x-transition>
      <div v-if="showTray" class="right-tray" :style="{ width: trayWidth }">
        <v-btn
          icon="mdi-chevron-right"
          class="collapse-btn tray-btn"
          @click="toggleTray"
          :style="{
            position: 'absolute',
            top: '50%',
            right: '33vw',
            transform: 'translateY(-50%)',
          }"
        ></v-btn>
        <v-container
          class="fill-height d-flex flex-column align-start mt-1 pt-2"
          style="border-left: 1px solid #b9b9b9; padding-left: 25px"
        >
          <div class="fill-height w-100">
            <h3 class="mt-0">
              <v-icon class="mr-1 mb-1" color="#b3f5e5" size="x-small"
                >mdi-auto-fix</v-icon
              >
              Composer<span class="text-grey-lighten-2 ml-2">:</span>
              <span class="text-grey ml-2">{{ title }}</span>
            </h3>

            <v-container v-if="loading" class="fill-height" fluid>
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
            <div
              v-else-if="coverLetter"
              class="w-100 mt-4 document-container pa-0"
            >
              <div
                id="coverletterdiv"
                class="pa-2 fill-height"
                ref="coverLetterDiv"
                @input="checkContentModified"
                contenteditable="true"
                style="background-color: #0e0e0e"
                v-html="coverLetter.replace(/\n/g, '<br>')"
              ></div>
              <v-btn
                icon="mdi-content-copy"
                class="copy-btn"
                size="x-small"
                @click="copyCoverLetter"
                :style="{
                  position: 'absolute',
                  top: '43px',
                  right: '42px',
                }"
              ></v-btn>
              <transition name="fade">
                <v-btn
                  icon="mdi-content-save"
                  class="copy-btn"
                  size="x-small"
                  :loading="saving"
                  v-if="coverLetter && contentModified"
                  @click="saveCoverLetter"
                  :style="{
                    position: 'absolute',
                    top: '43px',
                    right: '78px',
                  }"
                ></v-btn>
              </transition>
            </div>
          </div>
        </v-container>
      </div>
    </v-slide-x-transition>
    <v-btn
      v-if="trayData !== null && !showTray"
      icon="mdi-auto-fix"
      class="expand-btn tray-btn"
      @click="toggleTray"
      :style="{
        position: 'absolute',
        top: '56%',
        right: '-10px',
        transform: 'translateY(-50%)',
      }"
    ></v-btn>
  </div>
</template>

<script>
export default {
  props: {
    job: Object,
    title: String,
    contentType: String,
  },
  data() {
    return {
      saving: false,
      trayData: null,
      showTray: false,
      trayWidth: "35vw",
      loading: true,
      coverLetter: null,
      contentModified: false, // Add this data property
    };
  },
  watch: {
    job() {
      this.contentModified = false;
      this.loading = true;
      this.coverLetter = null;
      this.trayData = null;
      console.log(this.trayData, "this.trayData.watch.job");
      this.showTray = false;
    },
  },

  methods: {
    saveCoverLetter() {
      this.saving = true;

      const divContent = this.$refs.coverLetterDiv
        ? this.$refs.coverLetterDiv.innerHTML.replace(/<br>/g, "\n")
        : "";
      console.log(divContent, "divContent");
      this.coverLetter = divContent;

      console.log(this.job, "ComposerTray.job");
      const saveData = {
        jobId: this.job.guid ? this.job.guid : this.job.id,
        coverletter: divContent,
      };
      console.log(saveData, "saveData");
      window.electron.saveCoverletter(saveData);

      setTimeout(() => {
        this.contentModified = false;
        this.saving = false;
      }, 1000);
    },
    checkContentModified() {
      if (!this.$refs.coverLetterDiv) return false;

      const divContent = this.$refs.coverLetterDiv
        ? this.$refs.coverLetterDiv.innerHTML.replace(/<br>/g, "\n")
        : "";
      console.log(this.$refs, "this.$refs");
      console.log(this.coverLetter != divContent, "equal?");
      console.log("checkContentModified");
      this.contentModified = this.coverLetter != divContent;
    },
    copyCoverLetter() {
      const range = document.createRange();
      range.selectNodeContents(this.$refs.coverLetterDiv);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      try {
        document.execCommand("copy");
        console.log("Cover letter copied to clipboard");
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }

      selection.removeAllRanges();
    },
    async fetchJobContent() {
      try {
        const jobContent = await window.electron.getJobContent(
          this.contentType,
          JSON.parse(JSON.stringify(this.job))
        );
        // Handle the job content here, e.g., display it in the UI
        console.log(jobContent);
      } catch (error) {
        console.error("Error fetching job content:", error);
      }
    },
    async toggleTray() {
      console.log(this.contentType, "toggleTray");

      if (this.showTray) {
        // Save the current content of the div before collapsing the tray
        const divContent = this.$refs.coverLetterDiv
          ? this.$refs.coverLetterDiv.innerHTML.replace(/<br>/g, "\n")
          : "";
        this.coverLetter = divContent;
      }

      this.showTray = !this.showTray;

      if (this.showTray) {
        if (!this.coverLetter) {
          this.trayData = this.job;
          const jobContent = await window.electron.getJobContent(
            this.contentType,
            JSON.parse(JSON.stringify(this.job))
          );
          this.coverLetter = jobContent.coverletter;
          console.log(jobContent, "jobContent");

          this.$nextTick(() => {
            this.loading = !this.coverLetter;
            this.checkContentModified(); // Check content modification after DOM update
          });
        }
      }
    },
  },
};
</script>

<style scoped>
#coverletterdiv[contenteditable="true"] {
  outline: none; /* Remove the default outline */
  border: none; /* Remove any border */
  padding: 0; /* Adjust padding if necessary */
}

.copy-btn {
  color: rgb(179, 245, 229);
}
.tray-btn {
  border: 2px solid #b3f5e5;
  color: #b3f5e5;
}
.right-tray {
  height: 88vh;
  position: absolute;
  top: 12vh;
  right: 0;
  background: #141414;
  border-left: 1px solid #ddd;
  z-index: 1000;
  padding: 2px;
  border-top-left-radius: 10px;
}
.align-start {
  align-items: flex-start !important;
}
.collapse-btn {
  /* background: white !important; */
}
.expand-btn {
  /* background: white !important; */
}
.document-container {
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #6e6e6e;
  height: 80vh;
}
</style>
