/**
 * @swagger
 * /api/teachers:
 *   get:
 *     tags: [Teachers]
 *     summary: List all teachers
 *     responses:
 *       200:
 *         description: List of teachers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Teacher'
 *                 message:
 *                   type: string
 *                   example: List of teachers
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     tags: [Teachers]
 *     summary: Create a new teacher
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeacherInput'
 *     responses:
 *       201:
 *         description: Teacher created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teacher created
 *                 data:
 *                   $ref: '#/components/schemas/Teacher'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/teachers/{teacherId}:
 *   get:
 *     tags: [Teachers]
 *     summary: Get a single teacher
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Teacher record ID
 *     responses:
 *       200:
 *         description: Teacher details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Teacher'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   patch:
 *     tags: [Teachers]
 *     summary: Update a teacher
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeacherInput'
 *     responses:
 *       200:
 *         description: Teacher updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teacher updated
 *                 data:
 *                   $ref: '#/components/schemas/Teacher'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     tags: [Teachers]
 *     summary: Delete a teacher
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Teacher deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teacher deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
