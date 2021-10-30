import * as React from "react";

import { render, act } from "@testing-library/react";

import { Themed } from "./index";
import { createWrapper, delay } from "./testUtils";

test("Themed", async () => {
  const theme = {
    load: () => delay(10),
    size: {
      xs: 100,
      lg: "100px",
    },
  };
  const wrapper = createWrapper({
    theme,
    fallback: <div data-testid="loading" />,
  });
  const { getByTestId } = render(
    <Themed as="div" data-testid="done" w="xs" h="5lg" />,
    {
      wrapper,
    }
  );

  getByTestId("loading");
  await act(() => delay(15));
  const $done = getByTestId("done");
  expect($done.style.width).toBe("100px");
  expect($done.style.height).toBe("500px");
});
