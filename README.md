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

### Create your theme

```jsx
const theme = {
  fonts: {
    body: "system-ui, sans-serif",
    heading: '"Avenir Next", sans-serif',
    monospace: "Menlo, monospace",
  },
  colors: {
    text: "#000",
    background: "#fff",
    primary: "#33e",
  },
};
```

### Style your UI

```jsx
function Heading({ children }) {
  const { theme } = useTheme();
  return (
    <h1
      style={{
        color: theme.colors.primary,
        fontFamily: theme.fonts.heading,
      }}
    >
      {children}
    </h1>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Heading />
    </ThemeProvider>
  );
}
```

## Features

- Responsive styles
- No special configurations needed
- Universal (Android, iOS, Web, & more)
- Works with Expo
- Works with Vanilla React Native
- Works with Next.js
- Full theme support
- Super easy to custom theme (The theme object is just plain object)
- Super flexible, can use with many purposes (i18n module..)
- TypeScript support

## Examples

### Changing theme at Provider level

```jsx
import { ThemeProvider } from "reskin";
import { useState } from "react";

const lightTheme = {};
const darkTheme = {};

function App() {
  const [theme, setTheme] = useState(lightTheme);

  return (
    <ThemeProvider theme={theme}>
      <button onClick={() => setTheme(darkTheme)}>Dark</button>
      <button onClick={() => setTheme(lightTheme)}>Light</button>
    </ThemeProvider>
  );
}
```

### Changing theme at component level

```jsx
import { useTheme, ThemeProvider } from "reskin";
import { useState } from "react";

const lightTheme = {};
const darkTheme = {};

function ThemeToggler() {
  const { set } = useTheme();
  return (
    <div>
      <button onClick={() => set(darkTheme)}>Dark</button>
      <button onClick={() => set(lightTheme)}>Light</button>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(lightTheme);

  return (
    <ThemeProvider theme={theme} onChange={setTheme}>
      <ThemeToggler />
    </ThemeProvider>
  );
}
```

### Chaging theme by name

```js
import { useTheme, ThemeProvider } from "reskin";
import { useState } from "react";

const lightTheme = { name: "light" };
const darkTheme = { name: "dark" };

function ThemeToggler() {
  const { theme, set } = useTheme();
  return (
    <button onClick={() => set(theme.name === "dark" ? "light" : "dark")}>
      {theme.name}
    </button>
  );
}

function App() {
  const [theme, setTheme] = useState(lightTheme);

  return (
    <ThemeProvider
      theme={theme}
      onChange={(name) => setTheme(name === "dark" ? darkTheme : lightTheme)}
    >
      <ThemeToggler />
    </ThemeProvider>
  );
}
```

### Using responsive values

```jsx
import { useTheme, ThemeProvider } from "reskin";

import { useEffect } from "react";

const theme = {
  normalValue: 1,
  // responsive value
  fontSize: [
    // base value
    12,
    // for medium screen
    16,
    // for large screen
    24,
    // for extra large screen
    32,
  ],
};

function Heading() {
  const { theme } = useTheme();
  return <h1 style={{ fontSize: theme.fontSize }} />;
}

function App() {
  const screenSize = window.innerWidth;
  // calculate breakpoint base on screen size
  // the breakpoint is use to select correct responsive value
  const breakpoint =
    screenSize >= 1024 ? 3 : screenSize >= 768 ? 2 : screenSize >= 480 ? 1 : 0;

  useEffect(() => {
    // can use useWindowDimensions() in react native or window.addEventListener('resize') to update breakpoint
  }, []);

  return (
    <ThemeProvider theme={theme} breakpoint={breakpoint}>
      <Heading />
    </ThemeProvider>
  );
}
```

### Using query specific values

```jsx
import { useTheme, ThemeProvider } from "reskin";

const theme = {
  // query specific value
  fontSize: {
    $is: {
      // value for android
      android: 16,
      // value for safari
      safari: 17,
      // value for ios11
      'ios11': 15,
      // value for any ios query
      'ios.+': 15,
    },
  },
};

function Heading() {
  const { theme } = useTheme();
  return <h1 style={{ fontSize: theme.fontSize }} />;
}

function App() {
  return (
    <ThemeProvider theme={theme} query="ios12">
      <Heading />
    </ThemeProvider>
  );
}
```

### Using reskin as i18n module

```jsx
import { useTheme, ThemeProvider } from "reskin";
import { useState } from "react";

const en = { hello: "Hello" };
const fr = { hello: "Bonjour" };

function Heading() {
  const { theme } = useTheme();
  return <h1>{theme.hello}</h1>;
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
```

### Dynamic values

```jsx
const data = {
  // the dynamic value is evaluated once
  now: () => new Date(),
}

const styles = {
  reactNode: () => <View/>,
  styles: (sx) => StyleCreator.create({
    heading: {
      fontWeight: 'bold',
      fontSize: 30,
      // select value according to breakpoint
      margin: sx([10, 20, 30])
    }
  })
}

const en = {
  hello: 'Hello',
  world: 'World',
  // iterpolation
  greeting: ({ theme }) => `${theme.hello} ${theme.world}`
}
```
