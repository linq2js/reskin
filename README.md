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

## Using breakpoint to create responsive app

### React JS

```jsx
import { useEffect, useMemo, useState } from "react";
import { useTheme, ThemeProvider, findBreakpoint } from "reskin";

const commonSettings = { fontSize: [20, null, 40] };
const darkTheme = { ...commonSettings, background: "gray" };
const lightTheme = { ...commonSettings, background: "#c0c0c0" };

function ThemedComponent() {
  // useTheme hook returns current theme info
  const { theme } = useTheme();

  return (
    <div
      style={{
        background: theme.background,
        fontSize: theme.fontSize,
        height: 100
      }}
    >
      Hello World
    </div>
  );
}
function App() {
  // use light theme as default
  const [theme, setTheme] = useState(lightTheme);
  const [screenSize, setScreenSize] = useState(window.innerWidth);
  const [breakpoint, ratio] = useMemo(() => {
    // find breakpoint that fits for the current screen size
    const breakpoint = findBreakpoint(screenSize, [360, 768, 1024]);
    return [breakpoint, breakpoint >= 1 ? 1.5 : 1];
  }, [screenSize]);

  useEffect(() => {
    // handle window rezie event to update screenSize
    // try to resize window to see the effect
    const onResize = () => setScreenSize(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  return (
    <ThemeProvider theme={theme} breakpoint={breakpoint} ratio={ratio}>
      {/* create theme toggler  */}
      <button onClick={() => setTheme(darkTheme)}>Dark</button>
      <button onClick={() => setTheme(lightTheme)}>Light</button>
      <ThemedComponent />
    </ThemeProvider>
  );
}
```

### React Native

```jsx
import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  Button,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState } from 'react';
import { useTheme, ThemeProvider, findBreakpoint } from 'reskin';

const commonSettings = { fontSize: [20, null, 40] };
const darkTheme = { ...commonSettings, background: 'gray' };
const lightTheme = { ...commonSettings, background: '#c0c0c0' };

function ThemedComponent() {
  // useTheme hook returns current theme info
  const { theme } = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.background,
        height: 100,
      }}>
      <Text style={{ fontSize: theme.fontSize }}>Hello World</Text>
    </View>
  );
}

function App() {
  const { width } = useWindowDimensions();
  // use light theme as default
  const [theme, setTheme] = useState(lightTheme);
  const [breakpoint, ratio] = useMemo(() => {
    // find breakpoint that fits for the current screen size
    const breakpoint = findBreakpoint(width, [360, 768]);
    // rotate screen to see the effect
    return [breakpoint, breakpoint >= 0 ? 2 : 1];
  }, [width]);

  return (
    <SafeAreaView>
      <ThemeProvider theme={theme} breakpoint={breakpoint} ratio={ratio}>
        {/* create theme toggler  */}
        <View style={{ flexDirection: 'row' }}>
          <Button onPress={() => setTheme(darkTheme)} title="Dark" />
          <Button onPress={() => setTheme(lightTheme)} title="Light" />
        </View>
        <ThemedComponent />
      </ThemeProvider>
    </SafeAreaView>
  );
}

export default App;
```

## Advanced usages

### Using reskin as ii8n module

```jsx
import { useMemo, useState } from "react";
import { useTheme, ThemeProvider } from "reskin";

const commonTranslation = {
  now: () => new Date().toString(),
  // interpolation
  helloWorld: (x) => `${x.theme.translation.hello} World`,
  reactNode: (x) => (
    <strong>Current language: {x.theme.translation.language}</strong>
  )
};
const en = { ...commonTranslation, language: "en", hello: "Hello" };
const fr = { ...commonTranslation, language: "fr", hello: "Bonjour" };
const dark = { translation: en, background: "gray" };
const light = { translation: en, background: "#c0c0c0" };

function ThemedComponent() {
  // useTheme hook returns current theme info
  const { theme } = useTheme();

  return (
    <div
      style={{
        background: theme.background,
        padding: 50
      }}
    >
      {theme.translation.helloWorld} {theme.translation.now}{" "}
      {theme.translation.reactNode}
    </div>
  );
}

function ThemeActionBar() {
  // change method accepts any value as an argument
  // normally we pass new theme object or theme name, now we pass both language and theme names
  const { change } = useTheme();
  return (
    <>
      <button onClick={() => change("dark")}>Theme: Dark</button>
      <button onClick={() => change("light")}>Theme: Light</button>
      <button onClick={() => change("en")}>Language: English</button>
      <button onClick={() => change("fr")}>Language: France</button>
    </>
  );
}

function App() {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const combinedTheme = useMemo(() => {
    return {
      ...(theme === "dark" ? dark : light),
      translation: language === "fr" ? fr : en
    };
  }, [language, theme]);

  function handleChange(value) {
    if (value === "en" || value === "fr") {
      setLanguage(value);
    } else if (value === "dark" || value === "light") {
      setTheme(value);
    }
  }

  return (
    <ThemeProvider theme={combinedTheme} onChange={handleChange}>
      <ThemeActionBar />
      <ThemedComponent />
    </ThemeProvider>
  );
}

export default App;
```

## Concepts

### Responsive values

A simple array / tuple that contains multiple values, each item is used to specified breakpoint

```js
// let say you have the breakpoints [360, 480, 768]
// and current breakpoint index is 1
// your theme object looks like this
const theme = { fontSize: [10, 15, 20] };

const x = useTheme();
console.log(x.theme.fontSize); // 15
```

### Dynamic value

A value that can be evaluated once when the theme property is accessed

```js
const theme = { now: () => new Date(), something: 1 };
const x = useTheme();
console.log(x.theme.something); // theme.now is not evaluated
console.log(x.theme.now); // theme.now is evaluated
```

When evaluating dynamic value, reskin passes the theme context object as the first argument of the function. That can lead to circular function calls

```js
const theme = {
    prop1: (x) => x.theme.prop2,
    prop2: (x) => x.theme.prop1
}
```

## API References

### &lt;ThemeProvider/&gt;

It has following props

- theme (any, required): a theme object, it can be any object type. reskin will create a proxy object that references to this object, and calculate the object prop value according to breakpoint and ratio
- breakpoint (number, optional)
- ratio (number, optional)

### useTheme()

Returns theme context object, it has following props

- theme: a proxy of theme object which is passed to ThemeProvider
- original: a theme object which is passed to ThemeProvider
- context: a context object which is passed to ThemeProvider
- breakpoint: a breakpoint value which is passed to ThemeProvider
- ratio: a ratio value which is passed to ThemeProvider
- rx(values): returns value according to selected breakpoint and ratio
  ```jsx
  // let say you have ThemeProvider like this and your breakpoints are [360, 480, 768]
  // that means 1 is for 480 screen size
  <ThemeProvider breakpoint={1} />
  // your component implementation looks like this
  const rx = useTheme();
  const fontSize = rx([20, 24]); // fontSize will be 24 because your breakpoint index is 1
  ```
