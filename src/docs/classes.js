/**
 * @swagger
 * /api/classes:
 *   get:
 *     tags: [Classes]
 *     summary: List all classes
 *     description: Returns classes for the school, including their sections.
 *     responses:
 *       200:
 *         description: List of classes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 *                 message:
 *                   type: string
 *                   example: List of classes
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     tags: [Classes]
 *     summary: Create a class
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassInput'
 *     responses:
 *       201:
 *         description: Class created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Class created
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/classes/{classId}:
 *   patch:
 *     tags: [Classes]
 *     summary: Update a class
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassInput'
 *     responses:
 *       200:
 *         description: Class updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Class updated
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     tags: [Classes]
 *     summary: Delete a class
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Class deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Class deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /api/sections:
 *   get:
 *     tags: [Sections]
 *     summary: List all sections
 *     description: Optionally filter by `classId` query parameter. Includes the parent class.
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: integer
 *         description: Filter sections by class
 *     responses:
 *       200:
 *         description: List of sections
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Section'
 *                       - type: object
 *                         properties:
 *                           class:
 *                             $ref: '#/components/schemas/Class'
 *                 message:
 *                   type: string
 *                   example: List of sections
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     tags: [Sections]
 *     summary: Create a section
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SectionInput'
 *     responses:
 *       201:
 *         description: Section created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Section created
 *                 data:
 *                   $ref: '#/components/schemas/Section'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/sections/{sectionId}:
 *   patch:
 *     tags: [Sections]
 *     summary: Update a section
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SectionInput'
 *     responses:
 *       200:
 *         description: Section updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Section updated
 *                 data:
 *                   $ref: '#/components/schemas/Section'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     tags: [Sections]
 *     summary: Delete a section
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Section deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Section deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
