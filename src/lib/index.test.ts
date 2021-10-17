import { renderHook } from "@testing-library/react-hooks";

import { useTheme } from "./index";
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
      const { extract, theme } = useTheme<typeof defaultTheme>();
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
      const { extract, theme } = useTheme<typeof defaultTheme>();
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
      $platform: {
        web: 1,
        ios: 2,
        android: 3,
      },
    },
    group: {
      $platform: {
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
  const wrapper = createWrapper({ theme: defaultTheme, platform: "ios" });
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
      $platform: {
        "ios.+": 1,
        ios13: 2,
      },
    },
  };
  const wrapper = createWrapper({ theme: defaultTheme, platform: "ios14" });
  const { result } = renderHook(
    () => {
      const { theme } = useTheme<typeof defaultTheme>();
      return theme.fontSize;
    },
    { wrapper }
  );

  expect(result.current).toEqual(1);
});
