import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'io.ionic.starter',
    appName: 'todo-list',
    webDir: 'www',
    server: {
        iosScheme: 'https',
        hostname: 'localhost',
    },
};

export default config;
