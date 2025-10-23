const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, deleteFile } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/upload/profile-image:
 *   post:
 *     summary: 프로필 이미지 업로드
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 프로필 이미지 파일
 *     responses:
 *       200:
 *         description: 이미지 업로드 성공
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
 *                         filename:
 *                           type: string
 *                           description: 업로드된 파일명
 *                         originalName:
 *                           type: string
 *                           description: 원본 파일명
 *                         size:
 *                           type: integer
 *                           description: 파일 크기 (바이트)
 *                         url:
 *                           type: string
 *                           description: 파일 접근 URL
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
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    message: 'Profile image uploaded successfully',
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: fileUrl
    }
  });
});

/**
 * @swagger
 * /api/upload/portfolio-images:
 *   post:
 *     summary: 포트폴리오 이미지 업로드 (다중)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 포트폴리오 이미지 파일들 (최대 10개)
 *     responses:
 *       200:
 *         description: 이미지들 업로드 성공
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
 *                               filename:
 *                                 type: string
 *                               originalName:
 *                                 type: string
 *                               size:
 *                                 type: integer
 *                               url:
 *                                 type: string
 *                         count:
 *                           type: integer
 *                           description: 업로드된 파일 수
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
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const uploadedFiles = req.files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    url: `/uploads/${file.filename}`
  }));

  res.json({
    success: true,
    message: 'Portfolio images uploaded successfully',
    data: {
      files: uploadedFiles,
      count: uploadedFiles.length
    }
  });
});

/**
 * @swagger
 * /api/upload/{filename}:
 *   delete:
 *     summary: 업로드된 파일 삭제
 *     tags: [Upload]
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
const deleteUploadedFile = asyncHandler(async (req, res) => {
  const { filename } = req.params;

  if (!filename) {
    return res.status(400).json({
      success: false,
      message: 'Filename is required'
    });
  }

  const deleted = deleteFile(filename);

  if (deleted) {
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }
});

// 보호된 라우트
router.post('/profile-image', authenticateToken, uploadSingle('image'), uploadProfileImage);
router.post('/portfolio-images', authenticateToken, uploadMultiple('images', 10), uploadPortfolioImages);
router.delete('/:filename', authenticateToken, deleteUploadedFile);

module.exports = router;