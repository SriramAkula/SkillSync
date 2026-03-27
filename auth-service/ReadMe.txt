Registration & Login Service
POST /api/auth/register
Body: { "username": "...", "password": "...", "role": "ROLE_LEARNER" }
Description: Registers a new user in the MySQL database.

POST /api/auth/login
Body: { "username": "...", "password": "..." }
Description: Returns a JWT token for authorized access.

Mentor Service
GET /api/mentors/search?skill=Java
Description: Returns a list of mentors filtered by skill.

PUT /api/mentors/{id}/status
Body: { "available": true }
Description: Updates mentor availability for the booking logic.

Session Service
POST /api/sessions/request
Header: Authorization: Bearer <JWT>
Body: { "mentorId": 1, "startTime": "...", "duration": 60 }
Description: Creates a session with status REQUESTED.

POST /api/sessions/{id}/accept
Description: Triggers the availability check. Throws MentorNotAvailableException if conflict exists.

Payment Service
POST /api/payments/process
Body: { "sessionId": 123, "amount": 50.00 }
Description: Finalizes the booking process.
