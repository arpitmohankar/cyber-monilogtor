import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Alert,
  IconButton,
  Container,
  Fade,
  Grow,
  Zoom,
  Slide,
  useTheme,
  alpha,
  Stack,
  Divider,
  Badge
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Computer,
  Warning,
  Description,
  Refresh,
  Security,
  BugReport,
  Timeline,
  DonutLarge,
  ArrowUpward,
  ArrowDownward,
  Circle
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from 'recharts';
import { useSnackbar } from 'notistack';
import apiService from '../services/api';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b'];

function Dashboard() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    weekLogs: 0,
    activeDevices: 0,
    logTypes: {},
    unreadAlerts: 0
  });
  const [timeline, setTimeline] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, timelineRes, logsRes] = await Promise.all([
        apiService.getStats(),
        apiService.getTimeline(7),
        apiService.getLogs({ limit: 5 })
      ]);

      setStats(statsRes.data.data);
      setTimeline(timelineRes.data.data);
      setRecentLogs(logsRes.data.data);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      enqueueSnackbar('Failed to fetch dashboard data', { variant: 'error' });
      setLoading(false);
      setRefreshing(false);
    }
  };

  const StatCard = ({ title, value, icon, color, trend, delay }) => (
    <Zoom in={!loading} timeout={1000} style={{ transitionDelay: `${delay}ms` }}>
      <Card 
        elevation={0}
        sx={{ 
          height: '100%',
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`
            : `linear-gradient(135deg, ${alpha(color, 0.15)} 0%, ${alpha(color, 0.05)} 100%)`,
          border: `1px solid ${alpha(color, 0.2)}`,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: `0 12px 24px ${alpha(color, 0.25)}`,
            border: `1px solid ${alpha(color, 0.4)}`,
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography 
                  color="textSecondary" 
                  variant="caption" 
                  sx={{ 
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                >
                  {title}
                </Typography>
              </Box>
              <Avatar 
                sx={{ 
                  bgcolor: alpha(color, 0.1), 
                  color: color,
                  width: 48, 
                  height: 48,
                  animation: 'pulse 2s infinite'
                }}
              >
                {icon}
              </Avatar>
            </Box>
            
            <Box>
              <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                {loading ? (
                  <Skeleton width={100} height={45} />
                ) : (
                  <span style={{ 
                    background: `linear-gradient(135deg, ${color} 0%, ${theme.palette.secondary.main} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {value.toLocaleString()}
                  </span>
                )}
              </Typography>
              
              {trend && (
                <Chip
                  size="small"
                  icon={trend > 0 ? <TrendingUp /> : <TrendingDown />}
                  label={`${trend > 0 ? '+' : ''}${trend}%`}
                  sx={{
                    bgcolor: trend > 0 ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                    color: trend > 0 ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 600,
                    border: `1px solid ${trend > 0 ? theme.palette.success.main : theme.palette.error.main}`,
                  }}
                />
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Zoom>
  );

  const pieData = Object.entries(stats.logTypes || {}).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: value
  }));

  const lineChartData = timeline.map(t => ({
    date: new Date(t._id).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    activities: t.count
  }));

  const getLogIcon = (type) => {
    const icons = {
      keylog: '⌨️',
      screenshot: '📸',
      system: '💻',
      clipboard: '📋',
      webcam: '📷',
      alert: '🔔'
    };
    return icons[type] || '📝';
  };

  const getSeverityGradient = (severity) => {
    const gradients = {
      critical: 'linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%)',
      high: 'linear-gradient(135deg, #ffa94d 0%, #fd7e14 100%)',
      medium: 'linear-gradient(135deg, #74c0fc 0%, #339af0 100%)',
      low: 'linear-gradient(135deg, #8ce99a 0%, #51cf66 100%)'
    };
    return gradients[severity] || gradients.low;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Fade in={!loading} timeout={500}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography 
              variant="h3" 
              fontWeight="800"
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #fff 0%, #cbd5e0 100%)'
                  : 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Security Dashboard
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Real-time monitoring and threat detection
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Badge badgeContent={3} color="error">
              <IconButton 
                onClick={fetchDashboardData} 
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                <Refresh sx={{ 
                  animation: refreshing ? 'spin 1s linear infinite' : 'none' 
                }} />
              </IconButton>
            </Badge>
          </Stack>
        </Stack>
      </Fade>

      {/* Stats Cards with proper spacing */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Logs"
            value={stats.totalLogs}
            icon={<Description />}
            color="#667eea"
            trend={12}
            delay={100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Activity"
            value={stats.todayLogs}
            icon={<Timeline />}
            color="#764ba2"
            trend={-5}
            delay={200}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Devices"
            value={stats.activeDevices}
            icon={<Computer />}
            color="#f093fb"
            trend={8}
            delay={300}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Unread Alerts"
            value={stats.unreadAlerts}
            icon={<Warning />}
            color="#f5576c"
            delay={400}
          />
        </Grid>
      </Grid>

      {/* Charts Section with better spacing */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Slide direction="up" in={!loading} timeout={800}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                background: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.6)
                  : theme.palette.background.paper,
                backdropFilter: 'blur(10px)',
              }}
            >
              <Stack spacing={2} sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="600">
                  Activity Timeline
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Last 7 days activity trend
                </Typography>
              </Stack>
              
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={lineChartData}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                  <XAxis 
                    dataKey="date" 
                    stroke={theme.palette.text.secondary}
                    style={{ fontSize: '0.875rem' }}
                  />
                  <YAxis 
                    stroke={theme.palette.text.secondary}
                    style={{ fontSize: '0.875rem' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="activities"
                    stroke="#667eea"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorActivity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Slide>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Slide direction="up" in={!loading} timeout={1000}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                height: '100%',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                background: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.6)
                  : theme.palette.background.paper,
                backdropFilter: 'blur(10px)',
              }}
            >
              <Stack spacing={2} sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="600">
                  Log Distribution
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Activity types breakdown
                </Typography>
              </Stack>
              
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        style={{
                          filter: `drop-shadow(0px 4px 6px ${alpha(COLORS[index % COLORS.length], 0.3)})`
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <Stack spacing={1} sx={{ mt: 2 }}>
                {pieData.map((entry, index) => (
                  <Stack 
                    key={entry.name}
                    direction="row" 
                    alignItems="center" 
                    justifyContent="space-between"
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Circle sx={{ fontSize: 12, color: COLORS[index % COLORS.length] }} />
                      <Typography variant="body2">{entry.name}</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="600">
                      {entry.value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Slide>
        </Grid>
      </Grid>

      {/* Recent Activity with better design */}
      <Fade in={!loading} timeout={1200}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 3,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.6)
              : theme.palette.background.paper,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="center" 
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h6" fontWeight="600">
                Recent Activity
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Latest system events and alerts
              </Typography>
            </Box>
            <Chip 
              label="Live" 
              color="error" 
              size="small"
              icon={<Circle sx={{ fontSize: 8, animation: 'pulse 1.5s infinite' }} />}
            />
          </Stack>

          <List sx={{ p: 0 }}>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <ListItem 
                  key={i}
                  sx={{ 
                    px: 0,
                    py: 2,
                    borderBottom: i < 4 ? `1px solid ${theme.palette.divider}` : 'none'
                  }}
                >
                  <ListItemAvatar>
                    <Skeleton variant="circular" width={48} height={48} />
                  </ListItemAvatar>
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                </ListItem>
              ))
            ) : recentLogs.length > 0 ? (
              recentLogs.map((log, index) => (
                <Grow 
                  key={log._id}
                  in={true}
                  timeout={1000 + (index * 100)}
                >
                  <ListItem
                    sx={{
                      px: 2,
                      py: 2.5,
                      mb: 2,
                      borderRadius: 2,
                      background: alpha(theme.palette.primary.main, 0.03),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      transition: 'all 0.3s',
                      cursor: 'pointer',
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.08),
                        transform: 'translateX(8px)',
                      },
                    }}
                    secondaryAction={
                      <Stack spacing={1} alignItems="flex-end">
                        <Chip
                          label={log.severity || 'low'}
                          size="small"
                          sx={{
                            background: getSeverityGradient(log.severity),
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Stack>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          width: 56,
                          height: 56,
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>
                          {getLogIcon(log.type)}
                        </span>
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="600">
                          {log.type.toUpperCase()}
                        </Typography>
                      }
                      secondary={
                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="textSecondary">
                            Device: {log.deviceId}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                </Grow>
              ))
            ) : (
              <Alert 
                severity="info" 
                icon={<Security />}
                sx={{ 
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.info.main}`,
                }}
              >
                No recent activity detected. System is secure.
              </Alert>
            )}
          </List>
        </Paper>
      </Fade>

      {/* Add CSS for animations */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Container>
  );
}

export default Dashboard;
