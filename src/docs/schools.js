/**
 * @swagger
 * /api/schools:
 *   get:
 *     tags: [Schools]
 *     summary: List all schools
 *     responses:
 *       200:
 *         description: List of schools
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/School'
 *                 message:
 *                   type: string
 *                   example: List of schools
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     tags: [Schools]
 *     summary: Create a school
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchoolInput'
 *     responses:
 *       201:
 *         description: School created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: School created
 *                 data:
 *                   $ref: '#/components/schemas/School'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/schools/{schoolId}:
 *   patch:
 *     tags: [Schools]
 *     summary: Update a school
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchoolInput'
 *     responses:
 *       200:
 *         description: School updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: School updated
 *                 data:
 *                   $ref: '#/components/schemas/School'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     tags: [Schools]
 *     summary: Delete a school
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: School deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: School deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
