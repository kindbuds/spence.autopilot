import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

const vuetify = createVuetify({
    theme: {
        defaultTheme: 'dark', // Enables dark mode
        themes: {
            dark: {
                dark: true,
                colors: {
                    primary: '#1976D2', // Adjust your colors
                },
            },
            light: {
                dark: false,
                colors: {
                    primary: '#1976D2', // Adjust your colors
                },
            },
        },
    },
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        },
    },
});

export default vuetify;
