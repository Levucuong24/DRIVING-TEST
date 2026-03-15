const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Destination directory where uploaded files will be stored
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function (req, file, cb) {
        // Rename the file to ensure uniqueness
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Init upload containing storage config and file filter for images only
const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports the following filetypes - " + filetypes));
    }
});

// Single image upload route
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded or invalid file type' });
        }
        
        // Return the accessible URL for the uploaded file
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.status(200).json({ url: fileUrl });
    } catch (error) {
        console.error('Error in file upload:', error);
        res.status(500).json({ message: 'Server error during file upload', error: error.message });
    }
});

module.exports = router;
