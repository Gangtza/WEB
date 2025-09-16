const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt'); // Import bcrypt

const app = express();
const port = 3000;

const uploadDir = path.join(__dirname, 'upload');
const dbPath = path.join(__dirname, 'db.json');

// Temporary: Hash 'journaltschool' and log it
bcrypt.hash('journaltschool', 10, (err, hash) => {
    if (err) console.error('Error hashing password:', err);
    console.log('Hashed password for "journaltschool":', hash);
});

// --- Setup ---
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));

// --- Multer Storage ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'upload/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// --- Middleware ---
app.use(express.static(__dirname));
app.use('/upload', express.static(uploadDir));
app.use(express.json()); // Middleware to parse JSON bodies

// --- API Endpoints ---

// Get all file entries
app.get('/files', (req, res) => {
    fs.readFile(dbPath, (err, data) => {
        if (err) return res.status(500).json({ error: 'Could not read database.' });
        res.json(JSON.parse(data).reverse());
    });
});

// Upload a new file
app.post('/upload', upload.single('file'), (req, res) => {
    if (req.body.password !== '0809') {
        return res.status(401).json({ error: '密碼錯誤!' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    const newEntry = {
        id: Date.now(),
        image: req.file.filename,
        title: req.body.title || '',
        description: req.body.description || ''
    };
    fs.readFile(dbPath, (err, data) => {
        if (err) return res.status(500).json({ error: 'Could not read database.' });
        const db = JSON.parse(data);
        db.push(newEntry);
        fs.writeFile(dbPath, JSON.stringify(db, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Could not save to database.' });
            res.json({ message: '上傳成功!', entry: newEntry });
        });
    });
});

// Delete an entry
app.post('/delete', (req, res) => {
    const { id, image, password } = req.body;

    if (password !== '0809') {
        return res.status(401).json({ error: '密碼錯誤!' });
    }
    if (!id || !image) {
        return res.status(400).json({ error: 'Missing ID or image filename.' });
    }

    // 1. Delete image file
    const imagePath = path.join(uploadDir, image);
    fs.unlink(imagePath, (err) => {
        if (err) console.error("Error deleting image file:", err); // Log error but continue
    });

    // 2. Delete from db.json
    fs.readFile(dbPath, (err, data) => {
        if (err) return res.status(500).json({ error: 'Could not read database.' });
        let db = JSON.parse(data);
        const initialLength = db.length;
        db = db.filter(item => item.id !== id);

        if (db.length === initialLength) {
            return res.status(404).json({ error: 'Item not found in database.' });
        }

        fs.writeFile(dbPath, JSON.stringify(db, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Could not update database.' });
            res.json({ message: '刪除成功!' });
        });
    });
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});