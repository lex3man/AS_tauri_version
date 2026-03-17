import { invoke } from "@tauri-apps/api/core"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  background: boolean
  setTheme: (theme: Theme) => void
  setBackground: (status: boolean) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  background: true,
  setTheme: () => null,
  setBackground: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "adventuresmart-theme",
  ...props
}: ThemeProviderProps) {
  const [background, setBackground] = useState(false)
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    background,
    setTheme: async (theme: Theme) => {
      if (background && theme == 'dark') {
        await invoke('switch_background')
        setBackground(false)
      }
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    setBackground: async (status: boolean) => {
      if (status && theme == 'dark') {
        await invoke('switch_theme')
        setTheme('light')
        localStorage.setItem(storageKey, theme)
      }
      await invoke('switch_background')
      setBackground(status)
    }
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}