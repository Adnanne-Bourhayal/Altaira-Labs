# 🚀 Altaira Labs – Lead Management System

A full-stack production-ready web application designed to capture, manage, and process business leads efficiently.

Built with a modern architecture combining Next.js (frontend), Spring Boot (backend), and PostgreSQL (Neon DB), deployed on Vercel and Render.

---

## 🌐 Live Demo

Frontend: https://altairalabs.vercel.app  
Backend API: https://altaira-labs-1.onrender.com  

---

## 🧠 Architecture

Client (Browser)  
↓  
Next.js (Vercel)  
↓ (API Proxy)  
Spring Boot (Render)  
↓  
PostgreSQL (Neon)  

---

## ⚙️ Tech Stack

Frontend:
- Next.js (App Router)
- TypeScript
- Tailwind CSS

Backend:
- Java 21
- Spring Boot 3
- Spring Data JPA

Database:
- PostgreSQL (Neon)

Infrastructure:
- Vercel
- Render
- GitHub

---

## ✨ Features

- Lead capture form (production-ready)
- Backend API with validation
- PostgreSQL persistence
- Rate limiting (anti-spam)
- API proxy (no CORS issues)
- Error handling
- Health endpoints

---

## 📡 API Endpoints

POST /api/v1/leads  
GET /api/v1/leads  
GET /api/v1/leads/{id}  
PATCH /api/v1/leads/{id}/status  

Health:
GET /api/v1/health  
GET /actuator/health  

---

## 🧪 Example Request

curl -X POST https://altaira-labs-1.onrender.com/api/v1/leads \
-H "Content-Type: application/json" \
-d '{
  "fullName": "John Doe",
  "businessName": "My Company",
  "email": "john@example.com",
  "industry": "Marketing",
  "goals": "Grow online presence",
  "website": ""
}'

---

## 🛠️ Local Setup

Clone:

git clone https://github.com/Adnanne-Bourhayal/Altaira-Labs.git  
cd Altaira-Labs  

Backend:

cd backend  
cp .env.example .env  

Edit:

SPRING_DATASOURCE_URL=your_neon_url  
SPRING_DATASOURCE_USERNAME=your_user  
SPRING_DATASOURCE_PASSWORD=your_password  

Run:

./mvnw spring-boot:run  

Frontend:

cd ..  
cp .env.local.example .env.local  

Edit:

NEXT_PUBLIC_API_URL=http://localhost:8080  

Run:

npm install  
npm run dev  

---

## 🚀 Deployment

Frontend:
- Vercel
- Connected to GitHub

Backend:
- Render
- Docker build

---

## 🎯 Purpose

This project demonstrates:

- Full-stack development
- Real production deployment
- Backend + database integration
- Modern frontend architecture

---

## 📈 Future Improvements

- Authentication (JWT)
- Admin dashboard
- Email notifications
- Analytics
- CRM features

---

## 👨‍💻 Author

Adnanne Bourhayal  
https://github.com/Adnanne-Bourhayal  

---

## ⭐ Notes

This is a real production-ready system, not a tutorial project.
