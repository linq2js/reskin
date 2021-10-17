import { useTheme, ThemeProvider } from "reskin";

import { useState } from "react";

const en = { getting: "Hello" };
const fr = { getting: "Bonjour" };

function Heading() {
  const { theme } = useTheme();
  return <h1 style={{ fontSize: theme.getting }} />;
}

function App() {
  const [theme, setTheme] = useState(en);
  return (
    <ThemeProvider theme={theme}>
      <button onClick={() => setTheme(en)}>EN</button>
      <button onClick={() => setTheme(fr)}>FR</button>
      <Heading />
    </ThemeProvider>
  );
}
