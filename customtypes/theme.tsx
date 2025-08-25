import { createContext } from "react";

export type Theme = {
  theme: string;
};

export type GlobalValues = {
  theme: string;
  setTheme: (arg: string) => void;
};

export const ThemeContext = createContext<GlobalValues>({
  theme: "light",
  setTheme: (e) => {
    e;
  },
});
