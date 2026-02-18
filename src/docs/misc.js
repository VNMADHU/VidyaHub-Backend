/**
 * @swagger
 * /api/events:
 *   get:
 *     tags: [Events]
 *     summary: List all events
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 message:
 *                   type: string
 *                   example: List of events
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     tags: [Events]
 *     summary: Create an event
 *     description: |
 *       Body accepts `eventDate` and optional `eventTime` (e.g. `"10:00"`).
 *       They are combined into a single `date` field as `new Date("2026-03-15T10:00")`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       201:
 *         description: Event created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event created
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/events/{eventId}:
 *   patch:
 *     tags: [Events]
 *     summary: Update an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       200:
 *         description: Event updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event updated
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     tags: [Events]
 *     summary: Delete an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     tags: [Announcements]
 *     summary: List all announcements
 *     responses:
 *       200:
 *         description: List of announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Announcement'
 *                 message:
 *                   type: string
 *                   example: List of announcements
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     tags: [Announcements]
 *     summary: Create an announcement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnnouncementInput'
 *     responses:
 *       201:
 *         description: Announcement created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Announcement created
 *                 data:
 *                   $ref: '#/components/schemas/Announcement'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/announcements/{announcementId}:
 *   patch:
 *     tags: [Announcements]
 *     summary: Update an announcement
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnnouncementInput'
 *     responses:
 *       200:
 *         description: Announcement updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Announcement updated
 *                 data:
 *                   $ref: '#/components/schemas/Announcement'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     tags: [Announcements]
 *     summary: Delete an announcement
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Announcement deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Announcement deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /api/achievements:
 *   get:
 *     tags: [Achievements]
 *     summary: List all achievements
 *     description: Includes student relation.
 *     responses:
 *       200:
 *         description: List of achievements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Achievement'
 *                       - type: object
 *                         properties:
 *                           student:
 *                             $ref: '#/components/schemas/Student'
 *                 message:
 *                   type: string
 *                   example: List of achievements
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     tags: [Achievements]
 *     summary: Create an achievement
 *     description: |
 *       Body field `date` maps to the database column `achievementDate`.
 *       `category` defaults to `"other"` if omitted.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AchievementInput'
 *     responses:
 *       201:
 *         description: Achievement created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Achievement created
 *                 data:
 *                   $ref: '#/components/schemas/Achievement'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/achievements/{achievementId}:
 *   patch:
 *     tags: [Achievements]
 *     summary: Update an achievement
 *     parameters:
 *       - in: path
 *         name: achievementId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AchievementInput'
 *     responses:
 *       200:
 *         description: Achievement updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Achievement updated
 *                 data:
 *                   $ref: '#/components/schemas/Achievement'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     tags: [Achievements]
 *     summary: Delete an achievement
 *     parameters:
 *       - in: path
 *         name: achievementId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Achievement deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Achievement deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /api/sports:
 *   get:
 *     tags: [Sports]
 *     summary: List all sports
 *     responses:
 *       200:
 *         description: List of sports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sport'
 *                 message:
 *                   type: string
 *                   example: List of sports
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     tags: [Sports]
 *     summary: Create a sport
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SportInput'
 *     responses:
 *       201:
 *         description: Sport created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sport created
 *                 data:
 *                   $ref: '#/components/schemas/Sport'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/sports/{sportId}:
 *   patch:
 *     tags: [Sports]
 *     summary: Update a sport
 *     parameters:
 *       - in: path
 *         name: sportId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SportInput'
 *     responses:
 *       200:
 *         description: Sport updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sport updated
 *                 data:
 *                   $ref: '#/components/schemas/Sport'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   delete:
 *     tags: [Sports]
 *     summary: Delete a sport
 *     parameters:
 *       - in: path
 *         name: sportId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sport deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sport deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
