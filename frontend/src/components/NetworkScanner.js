import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    CircularProgress,
    Chip,
    Alert,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Paper,
    Stack
} from '@mui/material';
import {
    Router,
    Computer,
    Dns,
    Security,
    CheckCircle,
    Error as ErrorIcon,
    Search,
    Radar
} from '@mui/icons-material';
import axios from 'axios';

function NetworkScanner() {
    const [loading, setLoading] = useState(false);
    const [scanType, setScanType] = useState(null); // 'network' or 'port'
    const [networkData, setNetworkData] = useState(null);
    const [portData, setPortData] = useState(null);
    const [targetIp, setTargetIp] = useState('');
    const [error, setError] = useState(null);

    const handleNetworkScan = async () => {
        setLoading(true);
        setScanType('network');
        setError(null);
        setNetworkData(null);

        try {
            const response = await axios.post('http://localhost:5000/api/scanner/network');
            setNetworkData(response.data);
        } catch (err) {
            setError('Network scan failed. Ensure backend is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePortScan = async (ip) => {
        const target = ip || targetIp;
        if (!target) return;

        setLoading(true);
        setScanType('port');
        setError(null);
        setPortData(null);

        try {
            const response = await axios.post('http://localhost:5000/api/scanner/ports', { target });
            setPortData(response.data);
        } catch (err) {
            setError(`Port scan failed for ${target}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary', mb: 4 }}>
                Network Security Scanner
            </Typography>

            <Grid container spacing={3}>
                {/* Network Discovery Card */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(145deg, #ffffff 0%, #f5f7fa 100%)' }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                <Radar color="primary" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h6">Network Discovery</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Scan local subnet for active devices
                                    </Typography>
                                </Box>
                            </Stack>

                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                onClick={handleNetworkScan}
                                disabled={loading}
                                startIcon={loading && scanType === 'network' ? <CircularProgress size={20} color="inherit" /> : <Search />}
                                sx={{ mt: 2 }}
                            >
                                {loading && scanType === 'network' ? 'Scanning Network...' : 'Scan Local Network'}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Port Scanner Card */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(145deg, #ffffff 0%, #f5f7fa 100%)' }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                <Security color="secondary" sx={{ fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h6">Vulnerability Scan</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Check specific IP for open ports
                                    </Typography>
                                </Box>
                            </Stack>

                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Enter Target IP (e.g. 192.168.1.1)"
                                    value={targetIp}
                                    onChange={(e) => setTargetIp(e.target.value)}
                                />
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => handlePortScan(null)}
                                    disabled={loading || !targetIp}
                                    startIcon={loading && scanType === 'port' ? <CircularProgress size={20} color="inherit" /> : <Dns />}
                                >
                                    Scan
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Results Section */}
                <Grid item xs={12}>
                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    {/* Network Results */}
                    {networkData && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Network Scan Results
                                    <Chip label={networkData.local_ip} size="small" sx={{ ml: 2 }} />
                                </Typography>

                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    {networkData.devices.map((device, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    border: '1px solid #eee',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    cursor: 'pointer',
                                                    '&:hover': { bgcolor: '#f5f5f5' }
                                                }}
                                                onClick={() => {
                                                    setTargetIp(device.ip);
                                                    handlePortScan(device.ip);
                                                }}
                                            >
                                                <Computer color={device.ip === networkData.local_ip ? "primary" : "action"} />
                                                <Box>
                                                    <Typography variant="subtitle2">{device.ip}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {device.hostname}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label="Scan Ports"
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ ml: 'auto', cursor: 'pointer' }}
                                                />
                                            </Paper>
                                        </Grid>
                                    ))}
                                    {networkData.devices.length === 0 && (
                                        <Grid item xs={12}>
                                            <Alert severity="info">No active devices found (or blocked by firewall).</Alert>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                    {/* Port Results */}
                    {portData && (
                        <Card sx={{ mt: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Port Scan Results: {portData.target}
                                </Typography>

                                <List>
                                    {portData.ports.map((port, index) => (
                                        <React.Fragment key={index}>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <CheckCircle color="success" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={`Port ${port.port} (${port.service})`}
                                                    secondary="Status: Open"
                                                />
                                                <Chip label="Open" color="success" size="small" />
                                            </ListItem>
                                            <Divider variant="inset" component="li" />
                                        </React.Fragment>
                                    ))}
                                    {portData.ports.length === 0 && (
                                        <ListItem>
                                            <ListItemIcon>
                                                <CheckCircle color="disabled" />
                                            </ListItemIcon>
                                            <ListItemText primary="No open ports found (common ports scanned)" />
                                        </ListItem>
                                    )}
                                </List>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}

export default NetworkScanner;
