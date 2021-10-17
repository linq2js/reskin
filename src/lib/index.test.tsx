import * as React from "react";

import { render, act } from "@testing-library/react";

import { themed, Themed } from "./index";
import { createWrapper, delay } from "./testUtils";

test("themed()", async () => {
  const theme = {
    load: () => delay(10),
  };
  const wrapper = createWrapper({
    theme,
    fallback: <div data-testid="loading" />,
  });
  const { getByTestId } = render(
    <>{themed("div", () => ({ "data-testid": "done" }))}</>,
    { wrapper }
  );

  getByTestId("loading");
  await act(() => delay(15));
  getByTestId("done");
});

test("<Themed/>", async () => {
  const theme = {
    load: () => delay(10),
  };
  const wrapper = createWrapper({
    theme,
    fallback: <div data-testid="loading" />,
  });
  const { getByTestId } = render(
    <Themed data-testid="done" props={() => null} />,
    { wrapper }
  );

  getByTestId("loading");
  await act(() => delay(15));
  getByTestId("done");
});
