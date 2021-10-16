# RESKIN

Responsive, theme-based library for ReactJs, Expo, React Native

## Installation

**NPM**

```bash
npm i reskin --save
```

**YARN**

```bash
yarn add reskin
```

## Getting started

```jsx
import { useState } from "react";
import { useTheme, ThemeProvider } from "reskin";
import "./styles.css";

const darkTheme = { text: "white", background: "black" };
const lightTheme = { text: "black", background: "white" };

function ThemedComponent() {
  // useTheme hook returns current theme info
  const { theme } = useTheme();

  return (
    <div style={{ background: theme.background, color: theme.text }}>
      Hello World
    </div>
  );
}
function App() {
  // use light theme as default
  const [theme, setTheme] = useState(lightTheme);

  return (
    <ThemeProvider theme={theme}>
      {/* create theme toggler  */}
      <button onClick={() => setTheme(darkTheme)}>Dark</button>
      <button onClick={() => setTheme(lightTheme)}>Light</button>
      <ThemedComponent />
    </ThemeProvider>
  );
}

export default App;
```
