/**
 * @swagger
 * /api/fees:
 *   get:
 *     tags: [Fees]
 *     summary: List all fees
 *     description: Optionally filter by `studentId` query parameter. Includes student details.
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: integer
 *         description: Filter fees for a specific student
 *     responses:
 *       200:
 *         description: List of fees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Fee'
 *                       - type: object
 *                         properties:
 *                           student:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               admissionNumber:
 *                                 type: string
 *                               rollNumber:
 *                                 type: string
 *                               classId:
 *                                 type: integer
 *                 message:
 *                   type: string
 *                   example: List of fees
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     tags: [Fees]
 *     summary: Create a fee record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeeInput'
 *     responses:
 *       201:
 *         description: Fee record created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fee record created
 *                 data:
 *                   $ref: '#/components/schemas/Fee'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/fees/{feeId}:
 *   get:
 *     tags: [Fees]
 *     summary: Get a single fee record
 *     parameters:
 *       - in: path
 *         name: feeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fee details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fee'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   patch:
 *     tags: [Fees]
 *     summary: Update a fee record
 *     parameters:
 *       - in: path
 *         name: feeId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeeInput'
 *     responses:
 *       200:
 *         description: Fee record updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fee record updated
 *                 data:
 *                   $ref: '#/components/schemas/Fee'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     tags: [Fees]
 *     summary: Delete a fee record
 *     parameters:
 *       - in: path
 *         name: feeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Fee deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fee record deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/fees/{feeId}/pay:
 *   post:
 *     tags: [Fees]
 *     summary: Record a payment
 *     description: |
 *       Marks a fee as paid or partially paid. Accumulates `paidAmount`
 *       and sets status to `paid` when fully paid or `partial` otherwise.
 *     parameters:
 *       - in: path
 *         name: feeId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayFeeRequest'
 *     responses:
 *       200:
 *         description: Payment recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment recorded successfully
 *                 data:
 *                   $ref: '#/components/schemas/Fee'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/fees/student/{studentId}:
 *   get:
 *     tags: [Fees]
 *     summary: Get fees for a student
 *     description: |
 *       Returns all fee records for a student along with a computed summary
 *       (`totalFees`, `totalPaid`, `totalPending`, `pendingCount`).
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student fee details with summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Fee'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalFees:
 *                       type: number
 *                       example: 50000
 *                     totalPaid:
 *                       type: number
 *                       example: 25000
 *                     totalPending:
 *                       type: number
 *                       example: 25000
 *                     pendingCount:
 *                       type: integer
 *                       example: 2
 *                     totalRecords:
 *                       type: integer
 *                       example: 4
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
