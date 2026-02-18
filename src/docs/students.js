/**
 * @swagger
 * /api/students:
 *   get:
 *     tags: [Students]
 *     summary: List all students
 *     description: Returns students for the school identified by `schoolId` in the request body (defaults to 1).
 *     responses:
 *       200:
 *         description: List of students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
 *                 message:
 *                   type: string
 *                   example: List of students
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     tags: [Students]
 *     summary: Create a new student
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentInput'
 *     responses:
 *       201:
 *         description: Student created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student created
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/students/{studentId}:
 *   get:
 *     tags: [Students]
 *     summary: Get a single student
 *     description: Returns student with class & section relations included.
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Student'
 *                 - type: object
 *                   properties:
 *                     class:
 *                       $ref: '#/components/schemas/Class'
 *                     section:
 *                       $ref: '#/components/schemas/Section'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   patch:
 *     tags: [Students]
 *     summary: Update a student
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentInput'
 *     responses:
 *       200:
 *         description: Student updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student updated
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     tags: [Students]
 *     summary: Delete a student
 *     description: |
 *       Deletes the student and all related attendance, marks, and achievement
 *       records in a single transaction.
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
