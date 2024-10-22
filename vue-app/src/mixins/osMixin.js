// src/mixins/osMixin.js
const osMixin = {
    data() {
        return {
            isMac: false,
            isWindows: false,
        };
    },
    created() {
        // Detect the platform using navigator
        const platform = navigator.platform.toLowerCase();

        if (platform.indexOf('mac') >= 0) {
            this.isMac = true;
        } else if (platform.indexOf('win') >= 0) {
            this.isWindows = true;
        }
    },
};

export default osMixin;
