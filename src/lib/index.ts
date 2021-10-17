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
  MutableRefObject,
} from "react";

export interface ThemeProviderProps {
  theme: Theme;
  ratio?: number;
  breakpoint?: number;
  query?: string;
  context?: any;
  fallback?: ReactNode;
  onChange?: (value: any) => void;
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
  theme: ThemeObject<T>;
  <T>(value: ResponsiveValue<T>): T | undefined;
  sx<T>(value: ResponsiveValue<T>): T | undefined;
  set(theme: any): void;
  select<T = any>(
    themeProps: Record<string, any>,
    value: any,
    defaultValue?: any
  ): T;
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

export type ThemeProp<T> = T extends Array<infer TItem>
  ? TItem
  : // prop value can be function
  T extends (...args: any[]) => any
  ? ReturnType<T>
  : T extends { $is: infer TQuery }
  ? TQuery extends { [key: string]: infer TProps }
    ? ThemeProp<TProps>
    : never
  : T extends { [key: string]: any }
  ? ThemeObject<T>
  : T extends null
  ? undefined
  : T;

export type ThemeObject<T> = {
  [key in keyof T]: ThemeProp<T[key]>;
};

type ThemeCache = {
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

    const cache = createThemeCache(
      breakpoint,
      ratio,
      theme,
      query,
      () => rerender({}),
      contextRef,
      onChangeRef
    );

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

function createThemeCache(
  breakpoint: number | undefined,
  ratio: number | undefined,
  theme: any,
  query: string | undefined,
  rerender: () => void,
  contextRef: MutableRefObject<any>,
  onChangeRef: MutableRefObject<((value: any) => void) | undefined>
) {
  const hasRatio = typeof ratio === "number";
  const hasBreakpoint = typeof breakpoint === "number";

  function tryFindActualValue(baseValue: any) {
    // for example: if your base breakpoint is 360, the actual screen size is 720
    // that means ratio is 2
    // we try to compute actual value using the formula baseValue * ratio
    if (hasRatio && typeof baseValue === "number") {
      return baseValue * ratio;
    }
    return baseValue;
  }

  function sx(value: any) {
    // responsive value
    if (Array.isArray(value)) {
      // use first value as base value
      const baseValue = value[0];
      // no break point
      if (!hasBreakpoint) {
        return tryFindActualValue(baseValue);
      }
      let selectedValue = value[breakpoint];
      // the value for specified breakpoint is not provided
      if (typeof selectedValue === "undefined" || selectedValue === null) {
        // and no ratio provided
        if (!hasRatio) {
          // we try to fallback to smaller breakpoint
          for (let i = breakpoint - 1; i >= 0; i--) {
            const v = value[i];
            if (typeof v !== "undefined" && v !== null) {
              return v;
            }
          }
          // no fallback value found
          return undefined;
        }
        return tryFindActualValue(baseValue);
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

  function select(props: any, value: any, def?: any): any {
    if (typeof value === "string") {
      return (
        props?.[value] ??
        (typeof def === "undefined" ? def : select(props, def))
      );
    }
    return sx(value) ?? (typeof def === "undefined" ? def : select(props, def));
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
            rerender();
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

  return cache;
}

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

function createThemeHook<T>(): () => ThemeContext<ThemeObject<T>> {
  return useTheme;
}

function findBreakpoint(
  actualSize: number,
  breakpoints: number[],
  defaultBreakpoint = 0
) {
  for (let i = breakpoints.length - 1; i >= 0; i--) {
    const screenSize = breakpoints[i];
    if (actualSize >= screenSize) {
      return [i, screenSize];
    }
  }
  return [defaultBreakpoint, breakpoints[defaultBreakpoint]];
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

function useRatio(
  screenSize: number,
  breakpoint: number,
  maxRatios: [number, number][],
  defaultRatio: number = 1
) {
  return useMemo(() => {
    let maxRatio = defaultRatio;
    for (let i = maxRatios.length - 1; i >= 0; i--) {
      if (screenSize >= maxRatios[i][0]) {
        maxRatio = maxRatios[i][1];
        break;
      }
    }
    return maxRatio;
  }, [breakpoint, maxRatios]);
}

export {
  useTheme,
  ThemeProvider,
  themed,
  Themed,
  createThemeHook,
  findBreakpoint,
  useRatio,
};
