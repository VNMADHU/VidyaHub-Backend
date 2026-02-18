/**
 * @swagger
 * /api/attendance:
 *   get:
 *     tags: [Attendance]
 *     summary: List attendance records
 *     description: Includes student relation. Filters by school.
 *     responses:
 *       200:
 *         description: List of attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Attendance'
 *                       - type: object
 *                         properties:
 *                           student:
 *                             $ref: '#/components/schemas/Student'
 *                 message:
 *                   type: string
 *                   example: Attendance records
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     tags: [Attendance]
 *     summary: Record attendance
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttendanceInput'
 *     responses:
 *       201:
 *         description: Attendance recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Attendance recorded
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/attendance/{attendanceId}:
 *   patch:
 *     tags: [Attendance]
 *     summary: Update an attendance record
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttendanceInput'
 *     responses:
 *       200:
 *         description: Attendance updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Attendance updated
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     tags: [Attendance]
 *     summary: Delete an attendance record
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attendance deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Attendance deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/attendance/summary:
 *   get:
 *     tags: [Attendance]
 *     summary: Attendance summary
 *     description: |
 *       Returns per-student attendance statistics.
 *       Computes `presentCount`, `absentCount`, and `percentage` on the fly.
 *     responses:
 *       200:
 *         description: Attendance summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       studentId:
 *                         type: integer
 *                       student:
 *                         $ref: '#/components/schemas/Student'
 *                       presentCount:
 *                         type: integer
 *                         example: 18
 *                       absentCount:
 *                         type: integer
 *                         example: 2
 *                       percentage:
 *                         type: number
 *                         example: 90
 *                 message:
 *                   type: string
 *                   example: Attendance summary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
