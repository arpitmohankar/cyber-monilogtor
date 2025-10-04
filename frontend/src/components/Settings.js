import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Slider
} from '@mui/material';
import {
  Email,
  Notifications,
  Security,
  Save,
  Send,
  CheckCircle,
  Info
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import apiService from '../services/api';

function Settings() {
  const { enqueueSnackbar } = useSnackbar();
  
  const [emailSettings, setEmailSettings] = useState({
    alertEmail: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: ''
  });

  const [alertSettings, setAlertSettings] = useState({
    enableAlerts: true,
    alertOnKeylog: false,
    alertOnScreenshot: true,
    alertOnSystem: true,
    alertOnWebcam: true,
    alertThreshold: 'high',
    alertFrequency: 5
  });

  const [customAlert, setCustomAlert] = useState({
    to: '',
    subject: '',
    message: '',
    priority: 'medium'
  });

  const handleSaveEmailSettings = async () => {
    try {
      await apiService.updateSettings({ email: emailSettings });
      enqueueSnackbar('Email settings saved successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to save email settings', { variant: 'error' });
    }
  };

  const handleSaveAlertSettings = async () => {
    try {
      await apiService.updateSettings({ alerts: alertSettings });
      enqueueSnackbar('Alert preferences saved successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to save alert preferences', { variant: 'error' });
    }
  };

  const handleTestEmail = async () => {
    try {
      await apiService.testEmail(emailSettings.alertEmail);
      enqueueSnackbar('Test email sent successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to send test email', { variant: 'error' });
    }
  };

  const handleSendCustomAlert = async () => {
    try {
      await apiService.sendAlert(customAlert);
      enqueueSnackbar('Alert sent successfully!', { variant: 'success' });
      setCustomAlert({ to: '', subject: '', message: '', priority: 'medium' });
    } catch (error) {
      enqueueSnackbar('Failed to send alert', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Settings & Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Email Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Email sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Email Configuration</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Alert Email Address"
                    type="email"
                    value={emailSettings.alertEmail}
                    onChange={(e) => setEmailSettings({...emailSettings, alertEmail: e.target.value})}
                    helperText="All security alerts will be sent to this email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="SMTP Host"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="SMTP Port"
                    type="number"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="SMTP Username"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpUser: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="SMTP Password"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveEmailSettings}
                    >
                      Save Settings
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Send />}
                      onClick={handleTestEmail}
                    >
                      Send Test Email
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Alert Preferences */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Notifications sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Alert Preferences</Typography>
              </Box>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={alertSettings.enableAlerts}
                      onChange={(e) => setAlertSettings({...alertSettings, enableAlerts: e.target.checked})}
                    />
                  }
                  label="Enable Email Alerts"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={alertSettings.alertOnKeylog}
                      onChange={(e) => setAlertSettings({...alertSettings, alertOnKeylog: e.target.checked})}
                    />
                  }
                  label="Alert on Keylog Detection"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={alertSettings.alertOnScreenshot}
                      onChange={(e) => setAlertSettings({...alertSettings, alertOnScreenshot: e.target.checked})}
                    />
                  }
                  label="Alert on Screenshot Capture"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={alertSettings.alertOnSystem}
                      onChange={(e) => setAlertSettings({...alertSettings, alertOnSystem: e.target.checked})}
                    />
                  }
                  label="Alert on System Changes"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={alertSettings.alertOnWebcam}
                      onChange={(e) => setAlertSettings({...alertSettings, alertOnWebcam: e.target.checked})}
                    />
                  }
                  label="Alert on Webcam Access"
                />
              </FormGroup>

              <Box mt={3}>
                <FormControl fullWidth>
                  <InputLabel>Alert Threshold</InputLabel>
                  <Select
                    value={alertSettings.alertThreshold}
                    onChange={(e) => setAlertSettings({...alertSettings, alertThreshold: e.target.value})}
                    label="Alert Threshold"
                  >
                    <MenuItem value="low">Low - All Events</MenuItem>
                    <MenuItem value="medium">Medium - Important Events</MenuItem>
                    <MenuItem value="high">High - Critical Events Only</MenuItem>
                    <MenuItem value="critical">Critical - Urgent Only</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box mt={3}>
                <Typography gutterBottom>Alert Frequency (minutes)</Typography>
                <Slider
                  value={alertSettings.alertFrequency}
                  onChange={(e, value) => setAlertSettings({...alertSettings, alertFrequency: value})}
                  valueLabelDisplay="auto"
                  min={1}
                  max={60}
                  marks={[
                    { value: 1, label: '1m' },
                    { value: 15, label: '15m' },
                    { value: 30, label: '30m' },
                    { value: 60, label: '60m' }
                  ]}
                />
              </Box>

              <Box mt={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Save />}
                  onClick={handleSaveAlertSettings}
                >
                  Save Preferences
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Send Custom Alert */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Security sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Send Custom Alert</Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                Use this form to manually send security alerts to specified recipients
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Recipient Email"
                    type="email"
                    value={customAlert.to}
                    onChange={(e) => setCustomAlert({...customAlert, to: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={customAlert.priority}
                      onChange={(e) => setCustomAlert({...customAlert, priority: e.target.value})}
                      label="Priority"
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={customAlert.subject}
                    onChange={(e) => setCustomAlert({...customAlert, subject: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Message"
                    value={customAlert.message}
                    onChange={(e) => setCustomAlert({...customAlert, message: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Send />}
                    onClick={handleSendCustomAlert}
                    disabled={!customAlert.to || !customAlert.subject || !customAlert.message}
                  >
                    Send Alert
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* System Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Info sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">System Information</Typography>
            </Box>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="API Connection" 
                  secondary="Connected to backend server"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Version" 
                  secondary="Cyber Monitor v1.0.0"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Last Update" 
                  secondary={new Date().toLocaleString()}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;
