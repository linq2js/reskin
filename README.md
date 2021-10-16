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

### Advanced usage

Using reskin as ii8n module

```jsx

import { useMemo, useState } from "react";
import { useTheme, ThemeProvider } from "reskin";

const commonTranslation = {
  now: () => new Date().toString(),
  // interpolation
  helloWorld: (x) => `${x.theme.translation.greeting} World`
};
const en = { ...commonTranslation, language: "en", gretting: "Hello" };
const fr = { ...commonTranslation, language: "fr", gretting: "Bonjour" };
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
      {theme.translation.helloWorld} {theme.translation.now}
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
