import React from 'react';
import { ThemeProvider } from 'next-themes';
import Home from './pages/Home';

function App() {
  return (
    <ThemeProvider attribute="class">
      <Home />
    </ThemeProvider>
  );
}

export default App;