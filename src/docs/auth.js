/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Service health check
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: vidya-hub-backend
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email & password
 *     description: |
 *       Authenticates a user and returns a JWT token.
 *       Rate-limited to **10 requests per 15 minutes**.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials or wrong role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               badCredentials:
 *                 value: { message: "Invalid email or password" }
 *               wrongRole:
 *                 value: { message: "This account is not registered as \"teacher\". Please select the correct role." }
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 *
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new school & admin account
 *     description: |
 *       Creates a new school and an admin user in a single transaction.
 *       The password is hashed with bcrypt (12 rounds).
 *       Rate-limited to **10 requests per 15 minutes**.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "An account with this email already exists."
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 *
 * /api/auth/otp:
 *   post:
 *     tags: [Auth]
 *     summary: Request a one-time password
 *     description: Sends an OTP to the given email (placeholder — not yet wired to an email provider).
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OtpRequest'
 *     responses:
 *       200:
 *         description: OTP requested
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP requested
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
