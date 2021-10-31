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
  children?: ReactNode;
}

export type ResponsiveValue<T = number> =
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

export type ComponentProps<T> = T extends FC<infer TProps>
  ? TProps
  : T extends Component<infer TProps>
  ? TProps
  : T extends (props: infer TProps) => any
  ? TProps
  : T extends { propTypes: infer TProps }
  ? TProps
  : T extends new (props: infer TProps) => any
  ? TProps
  : Record<string, any>;

export type ComponentStyle<TProps> = TProps extends { style: infer TStyle }
  ? TStyle
  : never;

export type ThemeContext<T = any, TContext = any> = {
  original: T;
  query?: string;
  context: TContext;
  breakpoint?: number;
  ratio?: number;
  theme: ThemeOf<T>;
  styles: Map<any, ThemeOf<any>>;
  <T>(value: ResponsiveValue<T>, type?: "spacing" | "size"): T | undefined;
  sx<T>(value: ResponsiveValue<T>, type?: "spacing" | "size"): T | undefined;
  set(theme: any): void;
  select<T = any>(
    themeProps: Record<string, any>,
    value: any,
    defaultValue?: any
  ): T;
};

export type ThemedValue =
  | string
  | number
  | (string | number)[]
  | false
  | null
  | undefined;

export type ThemedElement = {};

export type ThemedProps<T> = (
  | ({
      as: T;
      render?: never;
    } & { props?: ComponentProps<T> })
  | {
      as?: never;
      props?: never;
      render: (
        style: Record<string, any>,
        themeContext: ThemeContext
      ) => ReactNode;
    }
) & {
  /**
   * size (width and height)
   */
  s?: ThemedValue;
  /**
   * width
   */
  w?: ThemedValue;
  /**
   * height
   */
  h?: ThemedValue;
  /**
   * padding
   */
  p?: ThemedValue;
  /**
   * margin
   */
  m?: ThemedValue;
  /**
   * margin horizontal
   */
  mx?: ThemedValue;
  /**
   * margin vertical
   */
  my?: ThemedValue;
  /**
   * margin left
   */
  ml?: ThemedValue;
  /**
   * margin right
   */
  mr?: ThemedValue;
  /**
   * margin bottom
   */
  mb?: ThemedValue;
  /**
   * margin top
   */
  mt?: ThemedValue;
  /**
   * padding horizontal
   */
  px?: ThemedValue;
  /**
   * padding vertical
   */
  py?: ThemedValue;
  /**
   * padding left
   */
  pl?: ThemedValue;
  pr?: ThemedValue;
  pb?: ThemedValue;
  pt?: ThemedValue;
  [key: string]: any;
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
  ? ThemeOf<T>
  : T extends null
  ? undefined
  : T;

export type ThemeOf<T> = {
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

export const ThemeProvider: FC<ThemeProviderProps> = memo((props) => {
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

function parseValue(value: string) {
  const [_, str, unit] = /([-.\d]+)?(.+)/.exec(value) || [];
  if (!unit) {
    return { value };
  }
  return { value: str ? parseFloat(str) : 1, unit };
}

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

  function tryParseValue(value: any, type?: string) {
    if (!type || typeof value !== "string") {
      return value;
    }
    const v1 = parseValue(value);
    if (!v1.unit) return value;
    const uv = contextValue.theme[type][v1.unit];
    if (typeof uv === "undefined") {
      return value;
    }
    // maybe unit value includes other unit
    // ex: theme = { spacing: { sx: '100px' } }
    if (typeof uv === "string") {
      const v2 = parseValue(uv);
      if (v2.unit) {
        return v1.value * v2.value + v2.unit;
      }
    }
    return v1.value * uv;
  }

  function tryFindActualValue(baseValue: any, type?: string) {
    // for example: if your base breakpoint is 360, the actual screen size is 720
    // that means ratio is 2
    // we try to compute actual value using the formula baseValue * ratio
    if (hasRatio && typeof baseValue === "number") {
      return baseValue * ratio;
    }
    return tryParseValue(baseValue, type);
  }

  function sx(value: any, type?: string) {
    // responsive value
    if (Array.isArray(value)) {
      // use first value as base value
      const baseValue = value[0];
      // no break point
      if (!hasBreakpoint) {
        return tryFindActualValue(baseValue, type);
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
              return tryParseValue(v, type);
            }
          }
          // no fallback value found
          return undefined;
        }
        return tryFindActualValue(baseValue, type);
      }
      return tryParseValue(selectedValue, type);
    }
    return tryParseValue(value, type);
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
    select,
    styles: new Map(),
  });

  Object.defineProperty(sx, "theme", {
    get() {
      if (!themeProxy) {
        themeProxy = createProxy(theme, contextValue, undefined) as any;
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
export function extract<
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

export function useTheme<T = any>(): ThemeContext<T> {
  return useContext(themeContext);
}

export function useStyle<T extends (...args: any[]) => any>(
  key: string,
  style: T
): ThemeOf<ReturnType<T>>;
export function useStyle<T extends (...args: any[]) => any>(
  style: T,
  ...args: Parameters<T>
): ThemeOf<ReturnType<T>>;
export function useStyle<T>(style: T): ThemeOf<T>;
export function useStyle(...args: any[]): ThemeOf<any> {
  const context = useTheme();
  let key: any;
  let factory: () => any;

  // default key generator
  if (typeof args[0] === "function") {
    const f = args[0];
    const a = args.slice(1);
    key = f.name + "::" + a.join(":");
    factory = () => f(...a);
  }
  // custom key
  else if (typeof args[1] === "function") {
    key = args[0];
    factory = args[1];
  } else {
    key = args[0];
    factory = () => key;
  }
  let style = context.styles.get(key);
  if (!style) {
    style = createProxy(factory(), context, undefined);
    context.styles.set(key, style);
  }
  return style;
}

function createProxy(obj: any, sx: ThemeContext, parent: any) {
  const map = new Map<string | Symbol, any>();
  let keys: string[];
  const proxy = new Proxy(EMPTY_OBJECT, {
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
              value = createProxy(value, sx, proxy);
            }
          } else {
            value = createProxy(value, sx, proxy);
          }
        } else {
          if (typeof value === "function") {
            value = value(sx, parent, obj);
          }
          value = sx(value);
        }
        map.set(prop, value);
        return value;
      }
      return map.get(prop);
    },
  });

  return proxy;
}

export function isObject(value: any) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createThemeHook<T>(): () => ThemeContext<ThemeOf<T>> {
  return useTheme;
}

export function findBreakpoint(
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

function renderThemed<
  TComponent extends string | FC | Component | (new (props: any) => any)
>(
  tc: ThemeContext,
  props: ThemedProps<TComponent>,
  renderChildren?: (children: any) => any
) {
  const {
    s,
    w = s,
    h = s,
    p,
    m,
    mx = m,
    my = m,
    ml = mx,
    mr = mx,
    mt = my,
    mb = my,
    px = p,
    py = p,
    pl = px,
    pr = px,
    pt = py,
    pb = py,
    render,
    as,
    props: inputProps,
    style: inputStyle = inputProps?.style,
    children,
    ...otherProps
  } = props;
  const style: Record<string, any> = {};

  setStyle(tc, style, "size", "width", w);
  setStyle(tc, style, "size", "height", h);
  setStyle(tc, style, "spacing", "marginLeft", ml);
  setStyle(tc, style, "spacing", "marginTop", mt);
  setStyle(tc, style, "spacing", "marginRight", mr);
  setStyle(tc, style, "spacing", "marginBottom", mb);
  setStyle(tc, style, "spacing", "paddingLeft", pl);
  setStyle(tc, style, "spacing", "paddingRight", pr);
  setStyle(tc, style, "spacing", "paddingTop", pt);
  setStyle(tc, style, "spacing", "paddingBottom", pb);

  const finalProps = {
    style: Array.isArray(inputStyle)
      ? inputStyle.concat(style)
      : { ...style, ...inputStyle },
    children:
      renderChildren && typeof children !== "undefined"
        ? renderChildren(children)
        : children,
    ...otherProps,
    ...inputProps,
  };

  if (typeof render === "function") {
    return render(finalProps, tc);
  }

  return createElement(as as any, finalProps);
}

export function themed<
  TComponent extends string | FC | Component | (new (props: any) => any)
>(props: ThemedProps<TComponent>) {
  const tc = useTheme();
  const renderChildren = (children: any): any =>
    Array.isArray(children)
      ? children.map((child, index) =>
          renderThemed(tc, { key: index, ...child })
        )
      : renderThemed(tc, children, renderChildren);

  return renderThemed(tc, props, renderChildren);
}

export function Themed<
  TComponent extends string | FC | Component | (new (props: any) => any)
>(props: ThemedProps<TComponent>): any {
  const tc = useTheme();
  return renderThemed(tc, props);
}

function setStyle(
  sx: ThemeContext,
  style: Record<string, any>,
  type: "spacing" | "size",
  prop:
    | "width"
    | "height"
    | "marginLeft"
    | "marginTop"
    | "marginRight"
    | "marginBottom"
    | "paddingLeft"
    | "paddingRight"
    | "paddingTop"
    | "paddingBottom",
  value: ThemedValue
) {
  if (Array.isArray(value)) {
    style[prop] = sx(
      typeof sx.breakpoint === "undefined"
        ? value[0]
        : value[sx.breakpoint] ?? value[0],
      type
    );
  } else if (typeof value !== "undefined") {
    style[prop] = sx(value, type);
  }
}

export function useRatio(
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
