import { computed } from "vue";
import { useDisplay } from "vuetify";

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
            },
            mounted() {
                this.$nextTick(() => {
                    this.environment = window.electron.getNodeEnv();
                });
            },
        });
    },
};