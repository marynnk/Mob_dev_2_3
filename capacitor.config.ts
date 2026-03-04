import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'io.ionic.starter',
    appName: 'todo-list',
    webDir: 'www',
    server: {
        iosScheme: 'https',
        hostname: 'localhost',
    },
    ios: {
        backgroundColor: '#00000000',
    },
};

export default config;
