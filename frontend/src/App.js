import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';

import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LogViewer from './components/LogViewer';
import PacketAnalyzer from './components/PacketAnalyzer';
import NetworkScanner from './components/NetworkScanner';
import Settings from './components/Settings';

function App() {
  const [darkMode, setDarkMode] = useState(true);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#667eea',
          },
          secondary: {
            main: '#764ba2',
          },
          background: {
            default: darkMode ? '#0f1419' : '#f5f7fa',
            paper: darkMode ? '#1a202c' : '#ffffff',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        shape: {
          borderRadius: 12,
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Router>
          <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/logs" element={<LogViewer />} />
              <Route path="/packet-analyzer" element={<PacketAnalyzer />} />
              <Route path="/network-scanner" element={<NetworkScanner />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
