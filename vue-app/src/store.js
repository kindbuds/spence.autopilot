import { createStore } from 'vuex';

export default createStore({
    state: {
        user: null,
        authRequired: false,
        devToolsOpen: false, // Add this new state property
    },
    mutations: {
        setUser(state, user) {
            state.user = user;
        },
        clearUser(state) {
            state.user = null;
        },
        setAuthRequired(state, authRequired) {
            state.authRequired = authRequired;
        },
        setDevToolsState(state, isOpen) { // Add this new mutation
            state.devToolsOpen = isOpen;
        },
    },
    actions: {
        loadUser({ commit }) {
            window.electron.loadUser();
            window.electron.onUserData((event, userData) => {
                commit('setUser', userData);
            });
        },
        monitorDevTools({ commit }) { // Add this action to track dev tools
            const threshold = 160;

            const checkStatus = () => {
                const widthThreshold = window.outerWidth - window.innerWidth > threshold;
                const heightThreshold = window.outerHeight - window.innerHeight > threshold;
                const isOpen = widthThreshold || heightThreshold;
                commit('setDevToolsState', isOpen);
            };

            window.addEventListener('resize', checkStatus);
            setInterval(checkStatus, 1000); // Check periodically
        },
    },
});
