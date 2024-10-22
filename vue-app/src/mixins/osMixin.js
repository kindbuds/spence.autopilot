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
        const htmlElement = document.documentElement;

        try {


            if (platform.indexOf('mac') >= 0) {
                htmlElement.classList.add('mac');
                this.isMac = true;
            } else if (platform.indexOf('win') >= 0) {
                htmlElement.classList.add('win');
                this.isWindows = true;
            }

            // Add the current route name as a class to the <html> element
            // console.log(this.$route, 'this.$route')
            // console.log(this.$route.path.replace('/', ''), 'this.$route.path')

            let path;
            if (this.$route && this.$route.path) {
                path = this.cleanPath(this.$route.path);
            }

            if (path) {
                htmlElement.classList.add(path);
            }

            // Listen for route changes and update the class on the <html> element
            this.$watch('$route', (to, from) => {

                let fromPath, toPath;

                if (from.path) {
                    fromPath = this.cleanPath(from.path);
                    htmlElement.classList.remove(fromPath);
                }
                if (to.path) {
                    toPath = this.cleanPath(to.path);
                    htmlElement.classList.add(toPath);
                }
            });
        } catch (error) {
            console.log(error, 'osMixin error')
        }
    },
    methods: {
        cleanPath(path) {
            path = path.replace('/', '');
            if (!path) path = 'dashboard';
            return path;
        }
    },
    beforeDestroy() {
        // Clean up by removing platform and route classes from the <html> element
        const htmlElement = document.documentElement;
        htmlElement.classList.remove('mac', 'win');
        if (this.$route && this.$route.name) {
            htmlElement.classList.remove(this.$route.name);
        }
    },
};

export default osMixin;
