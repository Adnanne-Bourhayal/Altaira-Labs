# Altaira Labs – Full Stack System

This repository contains a full-stack application built to demonstrate real-world software engineering skills, including backend architecture, API design, database integration, and production deployment.

The project simulates a lead management workflow, focusing on clean architecture, scalability, and deployment practices.

---

## Overview

This is not a tutorial-based project.  
It is a practical implementation of a production-like system with:

- Backend API (Java + Spring Boot)
- Frontend application (Next.js)
- Database integration (PostgreSQL)
- Cloud deployment (Vercel + Render)

---

## Architecture

Frontend (Next.js - Vercel)  
↓  
API Proxy (Next.js server routes)  
↓  
Backend (Spring Boot - Render)  
↓  
Database (PostgreSQL - Neon)  

---

## Tech Stack

Frontend:
- Next.js (App Router)
- TypeScript
- Tailwind CSS

Backend:
- Java 21
- Spring Boot 3
- Spring Data JPA
- Hibernate

Database:
- PostgreSQL (Neon)

Infrastructure:
- Vercel
- Render
- GitHub

---

## Backend Highlights

- RESTful API design
- Layered architecture (Controller / Service / Repository)
- Input validation (Jakarta Validation)
- Global exception handling
- Rate limiting (Bucket4j)
- Health monitoring (Spring Actuator)
- Environment-based configuration

---

## Frontend Highlights

- App Router architecture (Next.js)
- API proxy to handle backend communication
- Form handling with async requests
- Error and loading state management
- Environment variable configuration
- Modular component structure

---

## Key Features

- Lead creation and persistence
- Backend validation and error handling
- Secure internal API routing
- Production deployment (frontend + backend)
- Database integration with real queries

---

## API Endpoints

POST   /api/v1/leads  
GET    /api/v1/leads  
GET    /api/v1/leads/{id}  
PATCH  /api/v1/leads/{id}/status  

Health:
GET /api/v1/health  
GET /actuator/health  

---

## Local Setup

Clone:

git clone https://github.com/Adnanne-Bourhayal/Altaira-Labs.git  
cd Altaira-Labs  

---

### Backend

cd backend  
cp .env.example .env  

Configure:

SPRING_DATASOURCE_URL=your_neon_url  
SPRING_DATASOURCE_USERNAME=your_user  
SPRING_DATASOURCE_PASSWORD=your_password  

Run:

./mvnw spring-boot:run  

---

### Frontend

cd ..  
cp .env.local.example .env.local  

Configure:

NEXT_PUBLIC_API_URL=http://localhost:8080  

Run:

npm install  
npm run dev  

---

## Deployment

Frontend deployed on Vercel  
Backend deployed on Render  

Both environments are connected to GitHub for continuous deployment.

---

## What This Project Demonstrates

- Full-stack development (frontend + backend)
- API design and integration
- Database modeling and persistence
- Environment configuration
- Debugging and production troubleshooting
- Deployment of distributed systems

---

## Author

Adnanne Bourhayal  
https://github.com/Adnanne-Bourhayal  

---

## Note

This project was built to demonstrate engineering capabilities and practical understanding of modern web architectures.
