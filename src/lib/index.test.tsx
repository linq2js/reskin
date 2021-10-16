import * as React from "react";

import { renderHook } from "@testing-library/react-hooks";

import { ThemeProvider, ThemeProviderProps, useTheme } from "./index";

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

  const obj = result.current[0];

  expect(result.current[0].string).toBe(theme.string);
  expect(result.current[0].number).toBe(theme.number);
  expect(result.current[0].responsive).toBe(1);
  expect(result.current[0].dynamic).toBe(dynamic);
  expect(result.current[0].nested.value1).toBe(theme.nested.value1);

  rerender();

  expect(result.current[0]).toBe(obj);

  expect(result.current[0].string).toBe(theme.string);
  expect(result.current[0].number).toBe(theme.number);
  expect(result.current[0].responsive).toBe(1);
  expect(result.current[0].dynamic).toBe(dynamic);
  expect(result.current[0].nested.value1).toBe(theme.nested.value1);
});

function createWrapper<T>(props: ThemeProviderProps<T>) {
  return ({ children }: any) =>
    React.createElement(ThemeProvider as any, props, children);
}
