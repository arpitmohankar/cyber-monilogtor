import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Grid,
    CircularProgress,
    Chip,
    Alert
} from '@mui/material';
import { CloudUpload, Assessment, Timeline } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function PacketAnalyzer() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setError(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('http://localhost:5000/api/packet/analyze', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setData(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to analyze packet file');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const protocolData = data ? Object.entries(data.summary.protocols).map(([name, value]) => ({ name, value })) : [];

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary', mb: 4 }}>
                Packet Capture Analyzer
            </Typography>

            <Card sx={{ mb: 4, background: 'linear-gradient(145deg, #ffffff 0%, #f5f7fa 100%)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Upload File
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUpload />}
                            sx={{ py: 1.5, px: 3 }}
                        >
                            Choose File
                            <input type="file" hidden accept=".pcap,.pcapng,.cap" onChange={handleFileChange} />
                        </Button>
                        <Typography variant="body1" color="text.secondary">
                            {file ? file.name : 'No file selected'}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleUpload}
                            disabled={!file || loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Assessment />}
                            sx={{ ml: 'auto', py: 1.5, px: 4, borderRadius: 2 }}
                        >
                            {loading ? 'Analyzing...' : 'Analyze Traffic'}
                        </Button>
                    </Box>
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </CardContent>
            </Card>

            {data && (
                <Grid container spacing={3}>
                    {/* Summary Cards */}
                    <Grid item xs={12} md={3}>
                        <Card sx={{ height: '100%', bgcolor: 'primary.main', color: 'white' }}>
                            <CardContent>
                                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total Packets</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{data.summary.total_packets}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ height: '100%', bgcolor: 'secondary.main', color: 'white' }}>
                            <CardContent>
                                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Duration</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{data.summary.duration.toFixed(2)}s</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Protocol Distribution</Typography>
                                <Box sx={{ height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={protocolData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {protocolData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Packet Table */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Recent Packets</Typography>
                                <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Time</TableCell>
                                                <TableCell>Source</TableCell>
                                                <TableCell>Destination</TableCell>
                                                <TableCell>Protocol</TableCell>
                                                <TableCell>Length</TableCell>
                                                <TableCell>Info</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.packets.map((packet, index) => (
                                                <TableRow key={index} hover>
                                                    <TableCell>{packet.time.toFixed(4)}</TableCell>
                                                    <TableCell>{packet.source}</TableCell>
                                                    <TableCell>{packet.destination}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={packet.protocol}
                                                            size="small"
                                                            color={packet.protocol === 'TCP' ? 'primary' : packet.protocol === 'UDP' ? 'secondary' : 'default'}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{packet.length}</TableCell>
                                                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {packet.info}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}

export default PacketAnalyzer;
