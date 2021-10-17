import {
  createElement,
  createContext,
  useMemo,
  useRef,
  useContext,
  memo,
  FC,
  ReactNode,
  useState,
  Component,
} from "react";

export interface ThemeProviderProps {
  theme: Theme;
  ratio?: number;
  breakpoint?: number;
  query?: string;
  context?: any;
  fallback?: ReactNode;
  onChange?: (themeContext: any) => void;
  suspense?: boolean;
  children?: React.ReactNode;
}

export type ResponsiveValue<T> =
  | undefined
  | null
  | T
  | (undefined | null | T)[];

export interface ThemeMeta<T> {}

export interface Theme {
  key?: string;
  load?: (context: ThemeContext) => any;
  query?: string;
  [key: string]: any;
}

export type ThemeContext<T = any, TContext = any> = {
  original: T;
  query?: string;
  context: TContext;
  breakpoint?: number;
  ratio?: number;
  theme: ThemeObjectInfer<T>;
  <T>(value: ResponsiveValue<T>): T | undefined;
  sx<T>(value: ResponsiveValue<T>): T | undefined;
  set(theme: any): void;
  select<T>(themeProps: any, value: T | T[] | undefined, defaultValue?: T): T;
  extract<
    TKey extends keyof TThemeProps,
    TThemeProps extends {},
    TProps extends {
      [key in keyof TThemeProps]?: boolean;
    }
  >(
    themeProps: TThemeProps,
    compProps: TProps,
    keys?: TKey | TKey[]
  ): [TThemeProps[TKey] | undefined, Omit<TProps, TKey>];
};

export type ThemePropInfer<T> = T extends Array<infer TItem>
  ? TItem
  : // prop value can be function
  T extends (...args: any[]) => any
  ? ReturnType<T>
  : T extends { $is: infer TQuery }
  ? TQuery extends { [key: string]: infer TProps }
    ? ThemePropInfer<TProps>
    : never
  : T extends { [key: string]: any }
  ? ThemeObjectInfer<T>
  : T extends null
  ? undefined
  : T;

export type ThemeObjectInfer<T> = {
  [key in keyof T]: ThemePropInfer<T[key]>;
};

type ThemeCache = {
  hasResponsiveValue: boolean;
  value: ThemeContext;
  ready?: boolean;
  error?: any;
  promise?: Promise<any>;
};

const themeContext = createContext<ThemeContext<any>>(null as any);
const EMPTY_OBJECT = {};

const ThemeProvider: FC<ThemeProviderProps> = memo((props) => {
  const {
    breakpoint,
    ratio,
    theme,
    children,
    context,
    suspense,
    fallback,
    query,
    onChange,
  } = props;
  const onChangeRef = useRef(onChange);
  const contextRef = useRef(context);
  const rerender = useState<any>()[1];
  const themeCacheRef = useRef(new Map<string, ThemeCache>());
  const cache = useMemo<ThemeCache>(() => {
    if (theme.key && themeCacheRef.current.has(theme.key)) {
      return themeCacheRef.current.get(theme.key) as ThemeCache;
    }
    const hasRatio = typeof ratio === "number";
    const hasBreakpoint = typeof breakpoint === "number";
    let hasResponsiveValue = false;

    function sx(value: any) {
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

    function extract<
      TKey extends keyof TThemeProps,
      TThemeProps extends {},
      TProps extends { [key in keyof TThemeProps]?: boolean }
    >(
      themeProps: TThemeProps,
      compProps: TProps,
      keys?: TKey | TKey[]
    ): [TThemeProps[TKey] | undefined, Omit<TProps, TKey>] {
      if (!keys) {
        keys = (themeProps as any)?.$$keys;
      }
      if (!Array.isArray(keys)) {
        keys = keys ? [keys as TKey] : [];
      }
      if (!keys.length) {
        return [undefined as any, compProps];
      }

      const clonedOfProps = { ...compProps };
      let found = false;
      let value: any = undefined;
      keys.forEach((key) => {
        if (!found && compProps[key]) {
          found = true;
          value = themeProps[key];
        }
        delete clonedOfProps[key];
      });
      return [value, clonedOfProps];
    }

    function select(props: any, value: any, def?: any) {
      if (typeof value === "string") {
        return props?.[value] ?? def;
      }
      return sx(value) ?? def;
    }

    function set(value: any) {
      onChangeRef.current?.(value);
    }

    let themeProxy: any;
    const contextValue: ThemeContext = Object.assign(sx, {
      query,
      breakpoint,
      ratio,
      theme: null as any,
      original: theme,
      sx,
      get context() {
        return contextRef.current;
      },
      set,
      extract,
      select,
    });

    Object.defineProperty(sx, "theme", {
      get() {
        if (!themeProxy) {
          themeProxy = createProxy(theme, contextValue) as any;
        }
        return themeProxy;
      },
    });

    const cache: ThemeCache = {
      get hasResponsiveValue() {
        return hasResponsiveValue;
      },
      value: contextValue,
    };

    if (typeof theme.load === "function") {
      try {
        const result = theme.load(contextValue);
        if (result && typeof result.then === "function") {
          cache.promise = result
            .catch((e: any) => {
              cache.error = e;
            })
            .finally(() => {
              cache.ready = true;
              rerender({});
            });
        } else {
          cache.ready = true;
        }
      } catch (e) {
        cache.error = e;
        cache.ready = true;
      }
    } else {
      cache.ready = true;
    }

    if (theme.key) {
      themeCacheRef.current.set(theme.key, cache);
    }

    return cache;
  }, [breakpoint, ratio, theme, query, rerender]);
  contextRef.current = context;
  onChangeRef.current = onChange;

  if (!cache.ready) {
    if (suspense) {
      throw cache.promise;
    }
    return fallback as any;
  }

  return createElement(themeContext.Provider, {
    value: cache.value,
    children,
  });
});

function useTheme<T = any>(): ThemeContext<T> {
  return useContext(themeContext);
}

function createProxy(obj: any, sx: ThemeContext) {
  const map = new Map<string | Symbol, any>();
  let keys: string[];
  return new Proxy(EMPTY_OBJECT, {
    get(_, prop) {
      if (prop === "$$keys") {
        if (!keys) {
          keys = Object.keys(obj);
        }
        return keys;
      }

      const hasValue = map.has(prop);
      if (!hasValue) {
        let value = obj[prop];
        // is plain object
        if (isObject(value)) {
          if ("$is" in value) {
            if (!value.$is) {
              throw new Error("Invalid query specific value");
            }
            if (!sx.query) {
              throw new Error("No query provided in ThemeProvider");
            }
            const queryValues = value.$is;
            value = queryValues.default;
            if (sx.query in queryValues) {
              value = queryValues[sx.query];
            } else {
              // using regex
              Object.entries(queryValues).some(([k, v]) => {
                // ignore default key
                if (k === "default") {
                  return;
                }
                const re = `^${k}\$`;
                if ((sx.query as string).match(re)) {
                  value = v;
                  return true;
                }
                return false;
              });
            }

            if (isObject(value)) {
              value = createProxy(value, sx);
            }
          } else {
            value = createProxy(value, sx);
          }
        } else {
          if (typeof value === "function") {
            value = value(sx, obj);
          }
          value = sx(value);
        }
        map.set(prop, value);
        return value;
      }
      return map.get(prop);
    },
  });
}

function isObject(value: any) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createThemeHook<T>(): () => ThemeContext<ThemeObjectInfer<T>> {
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

const Themed: FC<{
  as?: any;
  sx: (theme: ThemeContext) => any;
  [key: string]: any;
}> = memo((props) => {
  const { as, sx, ...others } = props;
  const theme = useTheme();
  return createElement(as || "div", { ...sx(theme), ...others });
});

function themed<T>(
  as: string | FC<T> | Component<T>,
  sx: (themeContext: ThemeContext) => T
): ReactNode {
  return createElement(Themed, { as, sx });
}

export {
  useTheme,
  ThemeProvider,
  themed,
  Themed,
  createThemeHook,
  findBreakpoint,
};
