import {
  createElement,
  createContext,
  useMemo,
  useRef,
  useContext,
} from "react";

export interface ThemeProviderProps<T> {
  theme: T;
  ratio?: number;
  breakpoint?: number;
  context?: any;
  onChange?: (theme: T) => void;
  children?: React.ReactNode;
}

export type ResponsiveValue<T> =
  | undefined
  | null
  | T
  | (undefined | null | T)[];

export interface ThemeUtils<T> {
  change(theme: T): void;
  rx<T>(value: ResponsiveValue<T>): T | undefined;
}

export type ThemeContextValue<T> = [T, ThemeUtils<T>];

export type ThemePropInfer<T> = T extends Array<infer TItem>
  ? TItem
  : T extends (...args: any[]) => any
  ? ReturnType<T>
  : T extends { [key: string]: any }
  ? ThemeObjectInfer<T>
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

function ThemeProvider<T>(props: ThemeProviderProps<T>) {
  const { breakpoint, ratio, theme, children, context, onChange } = props;
  const onChangeRef = useRef(onChange);
  const cacheRef = useRef<ThemeCache<T>>();
  const value = useMemo<ThemeContextValue<T>>(() => {
    // return prev cache value if responsive value used
    if (cacheRef.current && !cacheRef.current.hasResponsiveValue) {
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

    cacheRef.current = {
      hasResponsiveValue,
      value: [
        createProxy(theme, rx, context) as any as T,
        {
          rx,
          change(newTheme: T) {
            onChangeRef.current?.(newTheme);
          },
        },
      ],
    };

    return cacheRef.current.value;
  }, [breakpoint, ratio, theme]);
  onChangeRef.current = onChange;

  return createElement(themeContext.Provider, {
    value: value as any,
    children,
  });
}

function useTheme<T = {}>(): ThemeContextValue<ThemeObjectInfer<T>> {
  return useContext(themeContext);
}

function createProxy(obj: any, rx: (value: any) => any, context: any) {
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
          value = createProxy(value, rx, context);
        } else {
          if (typeof value === "function") {
            value = value(context);
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

export { useTheme, ThemeProvider };
