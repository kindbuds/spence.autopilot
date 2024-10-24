import { createStore } from 'vuex';

export default createStore({
    state: {
        user: null,
        authRequired: false
    },
    mutations: {
        setUser(state, user) {
            // console.log('Mutation setUser called with:', user);
            state.user = user;
        },
        clearUser(state) {
            state.user = null;
        },
        setAuthRequired(state, authRequired) {
            // console.log(authRequired, 'in store.setAuthRequired')
            state.authRequired = authRequired;
        },
    },
    actions: {
        loadUser({ commit }) {
            console.log('store.loadUser')
            // alert('in store.loadUser')
            window.electron.loadUser();
            window.electron.onUserData((event, userData) => {
                console.log("Received user data:", userData);
                commit('setUser', userData);
            });
        },
    },
});
