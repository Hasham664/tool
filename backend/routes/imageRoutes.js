import express from 'express';
import imageController, { urlSearch } from '../controllers/imageController.js';
import upload from '../middlewere/multer.js';

const router = express.Router();

router.post('/reverse-search', upload.single('image'), imageController);
router.post('/url-search', urlSearch); // <-- ✅ New route here

export default router;
