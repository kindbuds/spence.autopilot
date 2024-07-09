<template>
  <main class="dashboard">
    <h1>Dashboard</h1>
    <p>Welcome to your dashboard.</p>
    <!-- Insert dashboard widgets/components here -->
    <application-queue></application-queue>
    <completed-applications></completed-applications>
    <job-list-view></job-list-view>
  </main>
</template>

<script>
import ApplicationQueue from "@/components/dashboard/ApplicationQueue.vue";
import CompletedApplications from "@/components/dashboard/CompletedApplications.vue";
import JobListView from "@/components/dashboard/JobListView.vue";

export default {
  name: "DashboardPage",
  components: {
    ApplicationQueue,
    CompletedApplications,
    JobListView,
  },
};
</script>

<style scoped>
.dashboard {
  padding: 20px;
}
</style>
