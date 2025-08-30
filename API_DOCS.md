# 📘 CRM Project API Documentation

This document contains details of all available API endpoints for the CRM Project.  
All secured routes require **JWT Authentication** (`Authorization: Bearer <token>`).  

---

## 🔐 Auth Routes

### Register User
- **POST** `/api/auth/register`  
- **Description:** Register a new user in the system.  

#### Request Body:
```json
{
  "name": "Himanshu Kanojiya",
  "email": "himanshu@example.com",
  "password": "your_password_here"
}
Success Response (201):
json
Copy code
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "64d7c8f9a1b2c3d4e5f6g7h8",
    "name": "Himanshu Kanojiya",
    "email": "himanshu@example.com"
  },
  "token": "jwt_token_here"
}
Login User
POST /api/auth/login

Description: Login with email and password.

Request Body:
json
Copy code
{
  "email": "himanshu@example.com",
  "password": "your_password_here"
}
Success Response (200):
json
Copy code
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here"
}
Logout User
POST /api/auth/logout

Description: Logout current user (invalidate token).

Success Response:
json
Copy code
{
  "success": true,
  "message": "Logged out successfully"
}
Get Profile
GET /api/auth/profile

Headers: Authorization: Bearer <token>

Success Response:
json
Copy code
{
  "id": "64d7c8f9a1b2c3d4e5f6g7h8",
  "name": "Himanshu Kanojiya",
  "email": "himanshu@example.com"
}
Password Reset (Optional)
POST /api/auth/forgot-password

Body:

json
Copy code
{ "email": "himanshu@example.com" }
Sends reset link to email.

🌐 OAuth Routes (Google & GitHub)
Google Login
GET /api/auth/google

Redirects to Google login page.

Google Callback
GET /api/auth/google/callback

On success → returns JWT + user info.

GitHub Login
GET /api/auth/github

Redirects to GitHub login page.

GitHub Callback
GET /api/auth/github/callback

On success → returns JWT + user info.

👨‍💼 Employee Routes
Get All Employees
GET /api/employees

Headers: Authorization: Bearer <token>

Response:
json
Copy code
[
  { "id": "1", "name": "Amit", "role": "Manager" },
  { "id": "2", "name": "Rahul", "role": "Developer" }
]
Add Employee
POST /api/employees

Headers: Authorization: Bearer <token>

Body:
json
Copy code
{
  "name": "Rohit Sharma",
  "email": "rohit@example.com",
  "role": "Designer"
}
Update Employee
PUT /api/employees/:id

Body:
json
Copy code
{ "role": "Team Lead" }
Delete Employee
DELETE /api/employees/:id

Response:
json
Copy code
{
  "success": true,
  "message": "Employee deleted successfully"
}
📊 Dashboard Routes
Get Dashboard Stats
GET /api/dashboard

Headers: Authorization: Bearer <token>

Response:
json
Copy code
{
  "totalEmployees": 50,
  "activeProjects": 5,
  "newRegistrations": 10
}
✅ Notes
Replace localhost:8080 with your deployed URL in production.

All protected routes require valid JWT Token in headers.

OAuth requires proper GOOGLE_CLIENT_ID, GITHUB_CLIENT_ID in .env.