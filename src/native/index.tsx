import * as React from "react";
import { useMemo } from "react";
import { useWindowDimensions, View } from "react-native";

import { findBreakpoint, Themed } from "../lib";

<Themed render={() => null} />;
<Themed
  as={View}
  props={{ style: { alignContent: "flex-end" } }}
  data-testid="aaa"
/>;

export interface UseBreakpointsOptions {
  selector?: (width: number, height: number) => number;
}

export function useBreakpoint(
  breakpoints: number[],
  options: UseBreakpointsOptions = {}
) {
  const { width, height } = useWindowDimensions();
  const { selector } = options;
  const screenSize = selector?.(width, height) ?? width;

  const [breakpoint] = useMemo(() => {
    return findBreakpoint(screenSize, breakpoints);
  }, [screenSize, breakpoints]);

  return [breakpoint, screenSize];
}
