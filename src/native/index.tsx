import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { findBreakpoint } from "../lib";

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

  const breakpoint = useMemo(() => {
    return findBreakpoint(screenSize, breakpoints);
  }, [screenSize, breakpoints]);

  return breakpoint;
}
