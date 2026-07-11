interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  plugins?: Record<string, Record<string, unknown>>;
}

const config: CapacitorConfig = {
  appId: "com.fin.app",
  appName: "Fin",
  webDir: "dist",
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0a1628",
      showSpinner: false,
    },
  },
};

export default config;