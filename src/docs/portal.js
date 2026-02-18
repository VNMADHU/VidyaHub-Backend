/**
 * @swagger
 * /api/portal/student-login:
 *   post:
 *     tags: [Portal]
 *     summary: Student portal login
 *     description: |
 *       Login by **roll number** only — no password required.
 *       Returns the full student object with class, section, and school info.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentLoginRequest'
 *     responses:
 *       200:
 *         description: Student login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student login successful
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Student'
 *                     - type: object
 *                       properties:
 *                         class:
 *                           $ref: '#/components/schemas/Class'
 *                         section:
 *                           $ref: '#/components/schemas/Section'
 *                         school:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                             logo:
 *                               type: string
 *                               nullable: true
 *                 portalType:
 *                   type: string
 *                   example: student
 *       400:
 *         description: Roll number is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Roll Number is required
 *       404:
 *         description: No student found with this roll number
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: No student found with this Roll Number
 *
 * /api/portal/teacher-login:
 *   post:
 *     tags: [Portal]
 *     summary: Teacher portal login
 *     description: |
 *       Login by **teacher ID** only — no password required.
 *       Returns the full teacher object with classes and school info.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeacherLoginRequest'
 *     responses:
 *       200:
 *         description: Teacher login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teacher login successful
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Teacher'
 *                     - type: object
 *                       properties:
 *                         classes:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Class'
 *                         school:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                             logo:
 *                               type: string
 *                               nullable: true
 *                 portalType:
 *                   type: string
 *                   example: teacher
 *       400:
 *         description: Teacher ID is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Teacher ID is required
 *       404:
 *         description: No teacher found with this ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: No teacher found with this Teacher ID
 *
 * /api/portal/student/{studentId}:
 *   get:
 *     tags: [Portal]
 *     summary: Full student profile
 *     description: |
 *       Returns a comprehensive student profile including:
 *       attendance history, marks, achievements, fees,
 *       recent school events, announcements, and sports.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student profile with all related data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     student:
 *                       $ref: '#/components/schemas/Student'
 *                     attendance:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Attendance'
 *                     marks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Mark'
 *                     achievements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Achievement'
 *                     fees:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Fee'
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *                     announcements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Announcement'
 *                     sports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Sport'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/portal/teacher/{teacherId}:
 *   get:
 *     tags: [Portal]
 *     summary: Full teacher profile
 *     description: |
 *       Returns a comprehensive teacher profile including:
 *       assigned classes (with students & sections),
 *       recent school events, announcements, and sports.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Teacher profile with all related data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     teacher:
 *                       $ref: '#/components/schemas/Teacher'
 *                     classes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Class'
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *                     announcements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Announcement'
 *                     sports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Sport'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
