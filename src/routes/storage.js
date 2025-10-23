const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다'));
    }
  }
});

/**
 * @swagger
 * /api/storage/upload/portfolios:
 *   post:
 *     summary: 포트폴리오 이미지 업로드 (Supabase Storage 호환)
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 업로드할 이미지 파일들
 *     responses:
 *       200:
 *         description: 파일 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         files:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               url:
 *                                 type: string
 *                               size:
 *                                 type: number
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const uploadPortfolioImages = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const uploadedFiles = req.files.map(file => ({
    name: file.filename,
    url: `/uploads/${file.filename}`,
    size: file.size
  }));

  res.json({
    success: true,
    data: { files: uploadedFiles }
  });
});

/**
 * @swagger
 * /api/storage/upload/profile-image:
 *   post:
 *     summary: 프로필 이미지 업로드 (Supabase Storage 호환)
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 업로드할 프로필 이미지
 *     responses:
 *       200:
 *         description: 파일 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         file:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             url:
 *                               type: string
 *                             size:
 *                               type: number
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const uploadProfileImage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const uploadedFile = {
    name: req.file.filename,
    url: `/uploads/${req.file.filename}`,
    size: req.file.size
  };

  res.json({
    success: true,
    data: { file: uploadedFile }
  });
});

/**
 * @swagger
 * /api/storage/delete/{filename}:
 *   delete:
 *     summary: 파일 삭제 (Supabase Storage 호환)
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 파일명
 *     responses:
 *       200:
 *         description: 파일 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: 파일을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const deleteFile = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../uploads', filename);

  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    throw error;
  }
});

/**
 * @swagger
 * /api/storage/delete-multiple:
 *   post:
 *     summary: 여러 파일 삭제 (Supabase Storage 호환)
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filenames
 *             properties:
 *               filenames:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 삭제할 파일명 목록
 *     responses:
 *       200:
 *         description: 파일 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         deletedFiles:
 *                           type: array
 *                           items:
 *                             type: string
 *                         failedFiles:
 *                           type: array
 *                           items:
 *                             type: string
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const deleteMultipleFiles = asyncHandler(async (req, res) => {
  const { filenames } = req.body;
  
  if (!Array.isArray(filenames) || filenames.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Filenames array is required'
    });
  }

  const deletedFiles = [];
  const failedFiles = [];

  for (const filename of filenames) {
    try {
      const filePath = path.join(__dirname, '../../uploads', filename);
      await fs.access(filePath);
      await fs.unlink(filePath);
      deletedFiles.push(filename);
    } catch (error) {
      failedFiles.push(filename);
    }
  }

  res.json({
    success: true,
    data: {
      deletedFiles,
      failedFiles
    }
  });
});

/**
 * @swagger
 * /api/storage/public-url/{filename}:
 *   get:
 *     summary: 파일 공개 URL 생성 (Supabase Storage 호환)
 *     tags: [Storage]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: 파일명
 *     responses:
 *       200:
 *         description: 공개 URL 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         publicUrl:
 *                           type: string
 *       404:
 *         description: 파일을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const getPublicUrl = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const publicUrl = `${baseUrl}/uploads/${filename}`;

  res.json({
    success: true,
    data: { publicUrl }
  });
});

// 보호된 라우트
router.post('/upload/portfolios', authenticateToken, upload.array('files', 10), uploadPortfolioImages);
router.post('/upload/profile-image', authenticateToken, upload.single('file'), uploadProfileImage);
router.delete('/delete/:filename', authenticateToken, deleteFile);
router.post('/delete-multiple', authenticateToken, deleteMultipleFiles);

// 공개 라우트
router.get('/public-url/:filename', getPublicUrl);

module.exports = router;