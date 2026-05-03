# Team Task Manager

A full-stack collaborative task management app built with React, Node.js, Express, and MongoDB.

## Features
- JWT authentication (Signup / Login)
- Create projects — creator becomes Admin
- Admin: add/remove members, create/delete tasks, update anything
- Member: view assigned projects, update status of assigned tasks only
- Dashboard: total tasks, by status, by user, overdue tasks
- Kanban board per project (To Do / In Progress / Done)

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS v4, React Router v6, Axios
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs

---

## Local Setup

### Prerequisites
- Node.js >= 18
- MongoDB running locally or a MongoDB Atlas URI

### Backend
```bash
cd backend
npm install
# Edit .env with your MONGO_URI and JWT_SECRET
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

---

## Deployment on Railway

1. Push the repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **MongoDB** plugin or use MongoDB Atlas URI

### Backend service
- Root directory: `backend`
- Start command: `npm start`
- Environment variables:
  - `MONGO_URI` — your MongoDB connection string
  - `JWT_SECRET` — a strong secret key
  - `PORT` — Railway sets this automatically

### Frontend service
- Root directory: `frontend`
- Build command: `npm run build`
- Start command: `npx serve dist`
- Environment variable:
  - Update `src/services/api.js` `baseURL` to your Railway backend URL before building

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | No | Register |
| POST | /api/auth/login | No | Login |
| GET | /api/projects | Yes | List my projects |
| POST | /api/projects | Yes | Create project |
| GET | /api/projects/:id | Yes | Get project |
| POST | /api/projects/:id/members | Yes (Admin) | Add member |
| DELETE | /api/projects/:id/members/:userId | Yes (Admin) | Remove member |
| GET | /api/tasks/dashboard | Yes | Dashboard stats |
| GET | /api/tasks/:projectId | Yes | Get project tasks |
| POST | /api/tasks | Yes (Admin) | Create task |
| PUT | /api/tasks/:id | Yes | Update task |
| DELETE | /api/tasks/:id | Yes (Admin) | Delete task |
