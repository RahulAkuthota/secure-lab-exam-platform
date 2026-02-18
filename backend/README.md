# Secure Lab Exam Platform Backend (Offline)

## Tech Stack
- Node.js
- Express.js
- MongoDB (localhost only)
- Mongoose
- JWT
- bcrypt (for faculty passwords)

## Project Structure
```
backend/
  src/
    config/
    controllers/
    middlewares/
    models/
    routes/
    utils/
    server.js
  .env.example
```

## Run
1. Ensure local MongoDB is running on `127.0.0.1:27017`
2. Copy `.env.example` to `.env`
3. Install dependencies:
   - `npm install`
4. Start backend:
   - `npm run dev`

## Super Admin Setup
Insert one super admin manually in MongoDB:
```json
{
  "name": "Lab Super Admin",
  "email": "superadmin@lab.local",
  "role": "super_admin"
}
```

Generate JWT for this admin:
```bash
npm run admin:token -- <SUPER_ADMIN_ID> superadmin@lab.local
```

Use token as:
`Authorization: Bearer <token>`

## Main Routes
- `POST /auth/faculty/login`
- `POST /auth/student/enter`
- `POST /admin/add-faculty`
- `POST /faculty/create-exam`
- `POST /faculty/create-question-paper`
- `GET /faculty/my-exams`
- `POST /faculty/activate-exam`
- `POST /faculty/deactivate-exam`
- `GET /student/active-exams`
- `POST /student/start-exam`
- `POST /student/submit-exam`
