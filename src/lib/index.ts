import {
  createElement,
  createContext,
  useMemo,
  useRef,
  useContext,
  memo,
  FC,
  ReactNode,
} from "react";

export interface ThemeProviderProps<T> {
  theme: T;
  ratio?: number;
  breakpoint?: number;
  context?: any;
  onChange?: (themeContext: any) => void;
  children?: React.ReactNode;
}

export interface ThemedProps {
  children: (themeContext: ThemeContextValue<any>) => ReactNode;
}

export type ResponsiveValue<T> =
  | undefined
  | null
  | T
  | (undefined | null | T)[];

export interface ThemeMeta<T> {}

export type ThemeContextValue<T, TContext = any> = {
  original: T;
  context: TContext;
  breakpoint?: number;
  ratio?: number;
  theme: ThemeObjectInfer<T>;
  <T>(value: ResponsiveValue<T>): T | undefined;
  rx<T>(value: ResponsiveValue<T>): T | undefined;
  change(theme: any): void;
};

export type ThemePropInfer<T> = T extends Array<infer TItem>
  ? TItem
  : T extends (...args: any[]) => any
  ? ReturnType<T>
  : T extends { [key: string]: any }
  ? ThemeObjectInfer<T>
  : T extends null
  ? undefined
  : T;

export type ThemeObjectInfer<T> = {
  [key in keyof T]: ThemePropInfer<T[key]>;
};

type ThemeCache<T> = {
  hasResponsiveValue: boolean;
  value: ThemeContextValue<T>;
};

const themeContext = createContext<ThemeContextValue<any>>(null as any);
const EMPTY_OBJECT = {};

function ThemeProviderFC<T>(props: ThemeProviderProps<T>) {
  const { breakpoint, ratio, theme, children, context, onChange } = props;
  const onChangeRef = useRef(onChange);
  const cacheRef = useRef<ThemeCache<T>>();
  const contextRef = useRef(context);
  const value = useMemo<ThemeContextValue<T>>(() => {
    // return prev cache value if responsive value used and theme is not changed
    if (
      cacheRef.current &&
      !cacheRef.current.hasResponsiveValue &&
      cacheRef.current.value.original === theme
    ) {
      return cacheRef.current.value;
    }
    const hasRatio = typeof ratio === "number";
    const hasBreakpoint = typeof breakpoint === "number";
    let hasResponsiveValue = false;

    function rx(value: any) {
      // responsive value
      if (Array.isArray(value)) {
        hasResponsiveValue = true;
        // use first value as base value
        const baseValue = value[0];
        // no break point
        if (!hasBreakpoint) {
          if (hasRatio && typeof baseValue === "number") {
            return baseValue * ratio;
          }
          return baseValue;
        }
        let selectedValue = value[breakpoint];
        if (typeof selectedValue === "undefined" || selectedValue === null) {
          if (!hasRatio) {
            // fallback to previous value
            let fallbackValue: any = undefined;
            for (let i = breakpoint - 1; i >= 0; i--) {
              const v = value[i];
              if (typeof v !== "undefined" && v !== null) {
                fallbackValue = v;
                break;
              }
            }
            return fallbackValue;
          }
          if (typeof baseValue === "number") {
            return baseValue * ratio;
          }
          return baseValue;
        }
        return selectedValue;
      }
      return value;
    }
    let themeProxy: ThemeObjectInfer<T>;
    const themeContextValue = Object.assign(rx, {
      breakpoint,
      ratio,
      theme: null as any as ThemeObjectInfer<T>,
      original: theme,
      rx,
      get context() {
        return contextRef.current;
      },
      change(newTheme: T) {
        onChangeRef.current?.(newTheme);
      },
    });

    Object.defineProperty(rx, "theme", {
      get() {
        if (!themeProxy) {
          themeProxy = createProxy(theme, themeContextValue) as any;
        }
        return themeProxy;
      },
    });

    cacheRef.current = {
      get hasResponsiveValue() {
        return hasResponsiveValue;
      },
      value: themeContextValue,
    };

    return cacheRef.current.value;
  }, [breakpoint, ratio, theme]);
  contextRef.current = context;
  onChangeRef.current = onChange;

  return createElement(themeContext.Provider, {
    value: value as any,
    children,
  });
}

function useTheme<T = any>(): ThemeContextValue<ThemeObjectInfer<T>> {
  return useContext(themeContext);
}

function createProxy<T>(obj: any, rx: ThemeContextValue<T>) {
  const map = new Map<string | Symbol, any>();
  return new Proxy(EMPTY_OBJECT, {
    get(_, prop) {
      const hasValue = map.has(prop);
      if (!hasValue) {
        let value = obj[prop];
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          // is plain object
          value = createProxy(value, rx);
        } else {
          if (typeof value === "function") {
            value = value(rx);
          }
          value = rx(value);
        }
        map.set(prop, value);
        return value;
      }
      return map.get(prop);
    },
  });
}

function createThemeHook<T>(): () => ThemeContextValue<ThemeObjectInfer<T>> {
  return useTheme;
}

function findBreakpoint(
  screenSize: number,
  breakpoints: number[],
  defaultBreakpoint = 0
) {
  for (let i = breakpoints.length - 1; i >= 0; i--) {
    if (screenSize >= breakpoints[i]) {
      return i;
    }
  }
  return defaultBreakpoint;
}

const ThemedFC: FC<ThemedProps> = (props: ThemedProps) => {
  const theme = useTheme();
  return props.children(theme) as any;
};

const ThemeProvider = memo(ThemeProviderFC);

const Themed = memo(ThemedFC);

export { useTheme, Themed, ThemeProvider, createThemeHook, findBreakpoint };
