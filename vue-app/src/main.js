
import { createApp } from 'vue';
import App from './App.vue';
import store from './store';
import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from './layouts/MainLayout.vue';
// import BlankLayout from './layouts/BlankLayout.vue';
import HomePage from './pages/HomePage.vue';
import SetupPage from './pages/SetupPage.vue';
import SettingsPage from './pages/SettingsPage.vue';
import UpgradePage from './pages/UpgradePage.vue';
import LivePage from './pages/LivePage.vue';
import JobsPage from './pages/JobsPage.vue';
import DashboardPage from './pages/DashboardPage.vue';
import UpdatePage from './pages/UpdatePage.vue';
import LoginPage from './pages/LoginPage.vue';
import LogoutPage from './pages/LogoutPage.vue';
import AuthenticatedPage from './pages/AuthenticatedPage.vue';
import vuetify from './plugins/vuetify'
import userMixin from './mixins/userMixin';
import osMixin from './mixins/osMixin';
import globalMixin from './plugins/globalMixin';
import VueChartkick from 'vue-chartkick'
import 'chartkick/chart.js'
import 'vuetify/styles'
import './assets/main.css';
import '@mdi/font/css/materialdesignicons.css';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
Chart.register(...registerables);


// Check if the app is running inside Electron
// Check if the app is running inside Electron
if (!(window && window.electron)) {
    if (process.env.NODE_ENV === 'development') {
        console.log('Running in development mode outside of Electron');
    } else {
        //  window.location.href = 'https://getspence.ai/';
    }
}


// Define your routes
const routes = [
    {
        path: '/',
        component: MainLayout,
        children: [
            {
                path: '',
                component: HomePage,
                meta: { requiresAuth: true, requiresSetup: true } // Protect this route

            }
        ]
    },
    {
        path: '/upgrade',
        component: MainLayout,
        children: [
            {
                path: '',
                component: UpgradePage,
                meta: { requiresAuth: true, requiresSetup: true } // Protect this route

            }
        ]
    },
    {
        path: '/setup',
        component: MainLayout,
        children: [
            {
                path: '',
                component: SetupPage,
                meta: { requiresAuth: true, requiresSetup: false } // Protect this route

            }
        ]
    },
    {
        path: '/update',
        component: MainLayout,
        children: [
            {
                path: '',
                component: UpdatePage,
                meta: { requiresAuth: false, requiresSetup: false } // Protect this route

            }
        ]
    },
    {
        path: '/settings',
        component: MainLayout,
        children: [
            {
                path: '',
                component: SettingsPage,
                meta: { requiresAuth: true, requiresSetup: true } // Protect this route

            }
        ]
    },
    {
        path: '/dashboard',
        component: MainLayout,
        children: [
            {
                path: '',
                component: DashboardPage,
                meta: { requiresAuth: true, requiresSetup: true } // Protect this route
            }
        ]
    }, {
        path: '/authenticated',
        component: MainLayout,
        children: [
            {
                path: '',
                component: AuthenticatedPage,
                //   meta: { requiresAuth: true } // Protect this route
            }
        ]
    },
    {
        path: '/logout',
        component: MainLayout,
        children: [
            {
                path: '',
                component: LogoutPage
            }
        ]
    }, {
        path: '/login',
        component: MainLayout,
        children: [
            {
                path: '',
                component: LoginPage
            }]
    },
    {
        path: '/live',
        children: [
            {
                path: '',
                component: LivePage,
                meta: { requiresAuth: true, requiresSetup: true } // Protect this route
            }
        ]
    },
    {
        path: '/jobs',
        children: [
            {
                path: '',
                component: JobsPage,
                meta: { requiresAuth: true, requiresSetup: true } // Protect this route
            }
        ]
    }
];

// Create the router instance
const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Navigation guard to check for authentication
router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiresSetup = to.matched.some(record => record.meta.requiresSetup);
    // const user = store.state.user;
    console.log(requiresAuth, 'requiresAuth')
    console.log(requiresSetup, 'requiresSetup')
    store.commit('setAuthRequired', requiresAuth);

    if (requiresAuth) {
        if (requiresSetup) {
            const setup = window?.electron ? await window.electron.isLoggedInAndSetup() : false;
            console.log(setup, 'window.electron.isLoggedInAndSetup');
            setup ? next() : next('/setup');
        } else {
            const loggedIn = window?.electron ? await window.electron.isLoggedIn() : false;
            console.log(loggedIn, 'window.electron.isLoggedIn');
            loggedIn ? next() : next('/login');
        }
    } else {
        next();
    }
});

// Create the Vue application and use the router
console.log('Vue app is starting...');
try {
    const app = createApp(App);
    app.use(store);
    app.use(router);
    app.use(vuetify);
    app.mixin(userMixin);
    app.mixin(osMixin);
    app.use(globalMixin);
    app.use(VueChartkick);
    // app.config.globalProperties.$user = () => store.state.user;
    app.mount('#app');
} catch (error) {
    console.error('Error during Vue initialization:', error);
}
