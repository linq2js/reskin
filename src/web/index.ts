import { useEffect, useMemo, useRef, useState } from "react";

import { findBreakpoint } from "../lib";

export interface UseBreakpointsOptions {
  selector?: (width: number, height: number) => number;
  defaultScreenSize?: number;
}

export function useBreakpoint(
  breakpoints: number[],
  options: UseBreakpointsOptions = {}
) {
  const { selector, defaultScreenSize } = options;
  const selectorRef = useRef(selector);
  const [screenSize, setScreenSize] = useState(
    () => getScreenSize(selectorRef.current) ?? defaultScreenSize
  );

  const [breakpoint] = useMemo(() => {
    return findBreakpoint(screenSize, breakpoints);
  }, [screenSize, breakpoints]);

  selectorRef.current = selector;

  useEffect(() => {
    function handleResize() {
      setScreenSize(getScreenSize(selectorRef.current) ?? defaultScreenSize);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setScreenSize]);

  return [breakpoint, screenSize];
}

function getScreenSize(selector?: (width: number, height: number) => number) {
  return selector?.(window.innerWidth, window.innerHeight) ?? window.innerWidth;
}
