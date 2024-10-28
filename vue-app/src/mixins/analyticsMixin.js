// analyticsMixin.js

export default {
    methods: {
        async $ga4Event(eventName, params = {}) {
            if (window && window.electron && window.electron.ipcRenderer) {
                const userAgent = navigator.userAgent;
                // const userIp = await getUserIpAddress();

                const data = {
                    eventName: eventName,
                    params: params,
                    userAgent: userAgent,
                    //   ipOverride: userIp,
                };
                window.electron.ipcRenderer.send('ga4-event', data);
            } else {
                console.warn('IPC Renderer not available. Event not tracked.');
            }
        },
    },
};
