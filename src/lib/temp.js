import { useTheme, ThemeProvider } from "reskin";

const theme = {
  // platform specific value
  fontSize: {
    $platform: {
      ios: 15,
      android: 16,
    },
  },
};

function Heading() {
  const { theme } = useTheme();
  return <h1 style={{ fontSize: theme.fontSize }} />;
}

function App() {
  return (
    <ThemeProvider theme={theme} platform="ios">
      <Heading />
    </ThemeProvider>
  );
}
