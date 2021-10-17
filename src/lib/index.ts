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
  platform?: string;
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
  platform?: string;
  [key: string]: any;
}

export type ThemeContext<T = any, TContext = any> = {
  original: T;
  platform?: string;
  context: TContext;
  breakpoint?: number;
  ratio?: number;
  theme: ThemeObjectInfer<T>;
  <T>(value: ResponsiveValue<T>): T | undefined;
  rx<T>(value: ResponsiveValue<T>): T | undefined;
  change(theme: any): void;
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
  : T extends { $platform: infer TPlatform }
  ? TPlatform extends { [key: string]: infer TProps }
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
    platform,
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

    function change(value: any) {
      onChangeRef.current?.(value);
    }

    let themeProxy: any;
    const contextValue: ThemeContext = Object.assign(rx, {
      platform,
      breakpoint,
      ratio,
      theme: null as any,
      original: theme,
      rx,
      get context() {
        return contextRef.current;
      },
      change,
      extract,
    });

    Object.defineProperty(rx, "theme", {
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
  }, [breakpoint, ratio, theme, platform, rerender]);
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

function useTheme<T = any>(): ThemeContext<ThemeObjectInfer<T>> {
  return useContext(themeContext);
}

function createProxy(obj: any, rx: ThemeContext) {
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
          if ("$platform" in value) {
            if (!value.$platform) {
              throw new Error("Invalid platform specific value");
            }
            if (!rx.platform) {
              throw new Error("No platform provided in ThemeProvider");
            }
            value = value.$platform[rx.platform];
            if (isObject(value)) {
              value = createProxy(value, rx);
            }
          } else {
            value = createProxy(value, rx);
          }
        } else {
          if (typeof value === "function") {
            value = value(rx, obj);
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
  props: (theme: ThemeContext) => any;
  [key: string]: any;
}> = memo((props) => {
  const { as: a, props: p, ...o } = props;
  const theme = useTheme();
  return createElement(a || "div", { ...p(theme), ...o });
});

function themed<T>(
  type: string | FC<T> | Component<T>,
  props: (themeContext: ThemeContext) => T
): ReactNode {
  return createElement(Themed, { as: type, props });
}

export {
  useTheme,
  ThemeProvider,
  themed,
  Themed,
  createThemeHook,
  findBreakpoint,
};
