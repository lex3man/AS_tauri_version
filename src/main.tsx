import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./ctx/theme-provider";
import { SettingsProvider } from "./ctx/settings-provider";
import { Toaster } from 'sonner';
import { StateProvider } from "./ctx/state-provider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light">
      <SettingsProvider>
        <StateProvider>
          <App />
          <Toaster />
        </StateProvider>
      </SettingsProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
