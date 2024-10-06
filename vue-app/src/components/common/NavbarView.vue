<template>
  <div>
    <v-list v-if="user2" dense id="nav">
      <v-list-item
        v-for="(item, index) in navItems"
        :key="index"
        :to="item.to"
        @click="item.onClick ? item.onClick : null"
        :disabled="item.disabled"
        :color="item.color ? item.color : null"
      >
        <v-list-item-title>
          <v-icon size="x-small">{{ item.icon }}</v-icon>
          {{ item.title }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
export default {
  name: "NavBar",
  props: {
    user2: {
      type: Object,
      required: false,
    },
  },
  data() {
    return {
      navItems: [
        { title: "Home", icon: "mdi-home", to: "/" },
        { title: "Live", icon: "mdi-play", to: "/live" },
        { title: "Jobs", icon: "mdi-history", to: "/jobs" },
        // {
        //   title: "Applications",
        //   icon: "mdi-history",
        //   to: "/applications",
        //   disabled: true,
        // },
        { title: "Settings", icon: "mdi-cog", to: "/settings" },
        // { title: "Dashboard", icon: "mdi-view-dashboard", to: "/dashboard" },
        { title: "Logout", icon: "mdi-logout", to: "/logout", color: "red" },
      ],
    };
  },
  mounted() {
    console.log(this.user2, "this.user2");
    const disabled =
      this.user2 &&
      this.user2.existing_jobs &&
      this.user2.existing_jobs.length === 0;

    this.navItems[2].disabled = disabled;

    if (disabled && window.electron) {
      if (window.electron.onJobNew) {
        window.electron.onJobNew(async () => {
          // jobData
          this.navItems[2].disabled = false;
        });
      }
    }
  },
  methods: {
    async logout() {
      await window.electron.logout();
      this.$store.commit("clearUser");
    },
  },
};
</script>

<style scoped>
#nav {
  margin-top: 57px;
}
#nav .v-list-item-title {
  color: #c5c5d2;
}

#nav .v-list-item-title i {
  margin-right: 5px;
  padding-bottom: 3px;
}

#nav .v-list-item--active {
  color: #00ffc2;
}
</style>
