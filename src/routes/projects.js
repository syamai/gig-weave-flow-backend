const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getMyProjects
} = require('../controllers/projectController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { validate, projectValidation } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: 프로젝트 목록 조회
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어
 *       - in: query
 *         name: projectType
 *         schema:
 *           type: string
 *           enum: [fixed, hourly]
 *         description: 프로젝트 유형
 *       - in: query
 *         name: budgetRange
 *         schema:
 *           type: string
 *           enum: [under1m, 1m-5m, 5m-10m, over10m]
 *         description: 예산 범위
 *       - in: query
 *         name: techStackIds
 *         schema:
 *           type: string
 *         description: 기술 스택 ID (쉼표로 구분)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, open, in_progress, completed, cancelled]
 *           default: open
 *         description: 프로젝트 상태
 *     responses:
 *       200:
 *         description: 프로젝트 목록 조회 성공
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
 *                         projects:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Project'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             pages:
 *                               type: integer
 */
router.get('/', optionalAuth, getProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: 프로젝트 상세 조회
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 프로젝트 ID
 *     responses:
 *       200:
 *         description: 프로젝트 상세 조회 성공
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
 *                         project:
 *                           allOf:
 *                             - $ref: '#/components/schemas/Project'
 *                             - type: object
 *                               properties:
 *                                 proposals:
 *                                   type: array
 *                                   items:
 *                                     $ref: '#/components/schemas/Proposal'
 *                                 contracts:
 *                                   type: array
 *                                   items:
 *                                     $ref: '#/components/schemas/Contract'
 *       404:
 *         description: 프로젝트를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', optionalAuth, getProject);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: 프로젝트 생성
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - projectType
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 example: 웹사이트 리뉴얼 프로젝트
 *               description:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 2000
 *                 example: 기존 웹사이트를 모던한 디자인으로 리뉴얼하는 프로젝트입니다.
 *               projectType:
 *                 type: string
 *                 enum: [fixed, hourly]
 *                 example: fixed
 *               budgetMin:
 *                 type: number
 *                 example: 1000000
 *               budgetMax:
 *                 type: number
 *                 example: 5000000
 *               durationWeeks:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 52
 *                 example: 4
 *               techStackIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["uuid1", "uuid2"]
 *     responses:
 *       201:
 *         description: 프로젝트 생성 성공
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
 *                         project:
 *                           $ref: '#/components/schemas/Project'
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
 *       403:
 *         description: 권한 없음 (클라이언트만 가능)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticateToken, requireRole('CLIENT'), validate(projectValidation.create), createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: 프로젝트 수정
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 프로젝트 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 2000
 *               projectType:
 *                 type: string
 *                 enum: [fixed, hourly]
 *               budgetMin:
 *                 type: number
 *               budgetMax:
 *                 type: number
 *               durationWeeks:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 52
 *               status:
 *                 type: string
 *                 enum: [draft, open, in_progress, completed, cancelled]
 *               techStackIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: 프로젝트 수정 성공
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
 *                         project:
 *                           $ref: '#/components/schemas/Project'
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
 *       403:
 *         description: 권한 없음 (프로젝트 소유자만 가능)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 프로젝트를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticateToken, requireRole('CLIENT'), validate(projectValidation.update), updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: 프로젝트 삭제
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 프로젝트 ID
 *     responses:
 *       200:
 *         description: 프로젝트 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 없음 (프로젝트 소유자만 가능)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 프로젝트를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateToken, requireRole('CLIENT'), deleteProject);

/**
 * @swagger
 * /api/projects/my/projects:
 *   get:
 *     summary: 내 프로젝트 목록 조회
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, open, in_progress, completed, cancelled]
 *         description: 프로젝트 상태
 *     responses:
 *       200:
 *         description: 내 프로젝트 목록 조회 성공
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
 *                         projects:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Project'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             pages:
 *                               type: integer
 *       401:
 *         description: 인증 필요
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 없음 (클라이언트만 가능)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/my/projects', authenticateToken, requireRole('CLIENT'), getMyProjects);

module.exports = router;
