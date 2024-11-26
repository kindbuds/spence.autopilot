import { computed } from "vue";
import { useDisplay } from "vuetify";
import store from "@/store"; // Import your Vuex store

export default {
    install(app) {
        app.mixin({
            data() {
                return {
                    environment: null,
                };
            },
            computed: {
                isDevelopment() {
                    return this.environment === "development";
                },
                isMdAndUp() {
                    const display = useDisplay();
                    return computed(() => display.mdAndUp.value);
                },
                devToolsOpen() { // Access Vuex state directly in the mixin
                    return store.state.devToolsOpen;
                },
            },
            methods: {
                toggleDevTools() {
                    if (this.devToolsOpen) {
                        // Close Dev Tools
                        window.electron.openDevTools(); // Replace with actual Electron API
                        store.commit('setDevToolsState', false); // Update Vuex store
                    } else {
                        // Open Dev Tools
                        window.electron.openDevTools(); // Replace with actual Electron API
                        store.commit('setDevToolsState', true); // Update Vuex store
                    }
                },
            },
            mounted() {
                this.$nextTick(() => {
                    this.environment = window.electron.getNodeEnv();
                });
            },
        });
    },
};
