const router = require('express').Router();
const { spawn } = require('child_process');
const path = require('path');

// Helper to run python script
const runScanner = (args, res) => {
    const pythonScript = path.join(__dirname, '../python/network_scanner.py');
    const pythonProcess = spawn('python', [pythonScript, ...args]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Scanner exited with code ${code}`);
            return res.status(500).json({ success: false, error: 'Scan failed', details: errorString });
        }

        try {
            const results = JSON.parse(dataString);
            res.json(results);
        } catch (e) {
            res.status(500).json({ success: false, error: 'Failed to parse scan results', raw: dataString });
        }
    });
};

// Scan Network
router.post('/network', (req, res) => {
    runScanner(['scan_network'], res);
});

// Scan Ports
router.post('/ports', (req, res) => {
    const { target } = req.body;
    if (!target) {
        return res.status(400).json({ success: false, error: 'Target IP is required' });
    }
    runScanner(['scan_ports', target], res);
});

module.exports = router;
