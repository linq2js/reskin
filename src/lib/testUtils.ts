import { createElement } from "react";

import { ThemeProviderProps, ThemeProvider } from "./index";

export function createWrapper(props: ThemeProviderProps) {
  return ({ children }: any) =>
    createElement(ThemeProvider as any, props, children);
}

export function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
