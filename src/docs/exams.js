/**
 * @swagger
 * /api/exams:
 *   get:
 *     tags: [Exams]
 *     summary: List all exams
 *     description: Optionally filter by `classId` and `sectionId` query parameters. Includes marks relation.
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Filter by class
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: integer
 *         description: Filter by section
 *     responses:
 *       200:
 *         description: List of exams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Exam'
 *                 message:
 *                   type: string
 *                   example: List of exams
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     tags: [Exams]
 *     summary: Create an exam
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamInput'
 *     responses:
 *       201:
 *         description: Exam created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exam created
 *                 data:
 *                   $ref: '#/components/schemas/Exam'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/exams/{examId}:
 *   patch:
 *     tags: [Exams]
 *     summary: Update an exam
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamInput'
 *     responses:
 *       200:
 *         description: Exam updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exam updated
 *                 data:
 *                   $ref: '#/components/schemas/Exam'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     tags: [Exams]
 *     summary: Delete an exam
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Exam deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exam deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /api/marks:
 *   get:
 *     tags: [Marks]
 *     summary: List all marks
 *     description: Includes exam and student relations.
 *     responses:
 *       200:
 *         description: List of marks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Mark'
 *                       - type: object
 *                         properties:
 *                           exam:
 *                             $ref: '#/components/schemas/Exam'
 *                           student:
 *                             $ref: '#/components/schemas/Student'
 *                 message:
 *                   type: string
 *                   example: List of marks
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     tags: [Marks]
 *     summary: Create a mark entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarkInput'
 *     responses:
 *       201:
 *         description: Marks created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mark created
 *                 data:
 *                   $ref: '#/components/schemas/Mark'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/marks/{markId}:
 *   patch:
 *     tags: [Marks]
 *     summary: Update a mark
 *     parameters:
 *       - in: path
 *         name: markId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarkInput'
 *     responses:
 *       200:
 *         description: Mark updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mark updated
 *                 data:
 *                   $ref: '#/components/schemas/Mark'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     tags: [Marks]
 *     summary: Delete a mark
 *     parameters:
 *       - in: path
 *         name: markId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mark deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mark deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/marks/report:
 *   get:
 *     tags: [Marks]
 *     summary: Marks report
 *     description: |
 *       Returns a per-student marks report. Optionally filter by `studentId` query parameter.
 *       Computes average score on the fly.
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: integer
 *         description: Filter report for a specific student
 *     responses:
 *       200:
 *         description: Marks report
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
 *                       marks:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Mark'
 *                       average:
 *                         type: number
 *                         example: 82.5
 *                 message:
 *                   type: string
 *                   example: Marks report
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
