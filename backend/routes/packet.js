const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Configure multer for PCAP uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/pcap/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.pcap') || file.originalname.endsWith('.pcapng') || file.originalname.endsWith('.cap')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PCAP files are allowed.'));
        }
    }
});

// Analyze PCAP file
router.post('/analyze', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const pythonScript = path.join(__dirname, '../python/packet_analyzer.py');
    const pcapFile = req.file.path;

    const pythonProcess = spawn('python', [pythonScript, pcapFile]);

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
            console.error(`Python script exited with code ${code}`);
            console.error(`Error: ${errorString}`);
            return res.status(500).json({ success: false, error: 'Analysis failed', details: errorString });
        }

        try {
            const results = JSON.parse(dataString);
            res.json(results);
        } catch (e) {
            console.error('Failed to parse Python output:', e);
            res.status(500).json({ success: false, error: 'Failed to parse analysis results', raw: dataString });
        }
    });
});

module.exports = router;
