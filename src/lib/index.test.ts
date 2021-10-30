import { renderHook } from "@testing-library/react-hooks";

import { extract, useTheme, useStyle, ThemeContext } from "./index";
import { createWrapper } from "./testUtils";

test("should return theme object properly", () => {
  const dynamic = Math.random();
  const theme = {
    string: Math.random().toString(36),
    number: Math.random(),
    responsive: [1, 2, 3, null],
    dynamic: () => dynamic,
    nested: {
      value1: 1,
    },
  };
  const wrapper = createWrapper({ theme });
  const { result, rerender } = renderHook(() => useTheme<typeof theme>(), {
    wrapper,
  });

  const prevTheme = result.current.theme;

  expect(result.current.theme.string).toBe(theme.string);
  expect(result.current.theme.number).toBe(theme.number);
  expect(result.current.theme.responsive).toBe(1);
  expect(result.current.theme.dynamic).toBe(dynamic);
  expect(result.current.theme.nested.value1).toBe(theme.nested.value1);

  rerender();

  expect(result.current.theme).toBe(prevTheme);

  expect(result.current.theme.string).toBe(theme.string);
  expect(result.current.theme.number).toBe(theme.number);
  expect(result.current.theme.responsive).toBe(1);
  expect(result.current.theme.dynamic).toBe(dynamic);
  expect(result.current.theme.nested.value1).toBe(theme.nested.value1);
});

test("dynamic value", () => {
  const theme = {
    hello: "Hello",
    helloWorld: (x: any) => `${x.theme.hello} World`,
  };
  const wrapper = createWrapper({ theme });
  const { result } = renderHook(
    () => useTheme<typeof theme>().theme.helloWorld,
    { wrapper }
  );
  expect(result.current).toBe("Hello World");
});

test("extract() with default keys", () => {
  const defaultTheme = {
    spacing: {
      xl: 10,
      sm: [1, 2, 3],
    },
  };
  const wrapper = createWrapper({ theme: defaultTheme });
  const { result } = renderHook(
    () => {
      const props = { sm: true, other: 2 };
      const { theme } = useTheme<typeof defaultTheme>();
      const [value, otherProps] = extract(theme.spacing, props);
      return { value, otherProps };
    },
    { wrapper }
  );
  expect(result.current).toEqual({ value: 1, otherProps: { other: 2 } });
});

test("extract() with custom keys", () => {
  const defaultTheme = {
    spacing: {
      xl: 10,
      sm: [1, 2, 3],
    },
  };
  const wrapper = createWrapper({ theme: defaultTheme });
  const { result } = renderHook(
    () => {
      const props = { sm: true, other: 2 };
      const { theme } = useTheme<typeof defaultTheme>();
      const [value, otherProps] = extract(theme.spacing, props, "xl");
      return { value, otherProps };
    },
    { wrapper }
  );
  expect(result.current).toEqual({
    value: undefined,
    otherProps: { other: 2, sm: true },
  });
});

test("plaform specific", () => {
  const defaultTheme = {
    topKey: "aaa",
    fontSize: {
      $is: {
        web: 1,
        ios: 2,
        android: 3,
      },
    },
    group: {
      $is: {
        web: {
          fontSize: 1,
        },
        ios: {
          fontSize: 2,
        },
        android: {
          fontSize: 3,
        },
      },
    },
  };
  const wrapper = createWrapper({ theme: defaultTheme, query: "ios" });
  const { result } = renderHook(
    () => {
      const { theme } = useTheme<typeof defaultTheme>();
      return [theme.group.fontSize, theme.fontSize];
    },
    { wrapper }
  );

  expect(result.current).toEqual([2, 2]);
});

test("plaform specific with regex", () => {
  const defaultTheme = {
    topKey: "aaa",
    fontSize: {
      $is: {
        "ios.+": 1,
        ios13: 2,
      },
    },
  };
  const wrapper = createWrapper({ theme: defaultTheme, query: "ios14" });
  const { result } = renderHook(
    () => {
      const { theme } = useTheme<typeof defaultTheme>();
      return theme.fontSize;
    },
    { wrapper }
  );

  expect(result.current).toEqual(1);
});

test("useStyle", () => {
  const rootTheme = { width: 100 };
  const style = {
    width: ({ theme }: ThemeContext<typeof rootTheme>) => theme.width * 2,
  };
  const wrapper = createWrapper({ theme: rootTheme });
  const { result } = renderHook(
    () => {
      return useStyle(style).width;
    },
    { wrapper }
  );
  expect(result.current).toBe(200);
});

test("useStyle with key", () => {
  const rootTheme = { width: 100 };
  const style = (color: string) => ({ color });
  const wrapper = createWrapper({ theme: rootTheme });
  const { result } = renderHook(
    () => {
      const color1 = useStyle("green", () => style("red")).color;
      const color2 = useStyle(style, "blue").color;
      return [color1, color2];
    },
    { wrapper }
  );
  expect(result.current).toEqual(["red", "blue"]);
});

test("useStyle with args", () => {
  const rootTheme = { width: 100 };
  const style = {
    width: ({ theme }: ThemeContext<typeof rootTheme>) => theme.width * 2,
  };
  const wrapper = createWrapper({ theme: rootTheme });
  const { result } = renderHook(
    () => {
      return useStyle(style).width;
    },
    { wrapper }
  );
  expect(result.current).toBe(200);
});
