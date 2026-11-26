import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  ...props
}: ThemeProviderProps) {
  // Theme is authoritatively owned by the Rust-persisted `dark_mode`
  // setting — settings-provider.tsx's getSettings() applies it moments
  // after mount, and every explicit toggle (setDarkMode) goes through it
  // too. Don't seed initial state from localStorage: it's webview-local
  // storage, less durable than the Rust-side file, and can silently
  // diverge from it (e.g. cleared by the OS while the Rust file survives)
  // — that mismatch is what caused the app to flash the stale/wrong theme
  // on launch before flipping to the real one moments later. Starting from
  // `defaultTheme` (which matches this app's light-mode :root CSS
  // variables) means there's nothing wrong to flash in the meantime.
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
