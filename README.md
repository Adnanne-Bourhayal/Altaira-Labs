# Altaira Labs – Full Stack System

This repository contains a full-stack application developed to demonstrate real-world software engineering capabilities, with a focus on backend architecture, system design, security, and production deployment.

The project models a lead management workflow as a controlled environment to apply scalable and maintainable design patterns.

---

## Architecture

Frontend (Next.js - Vercel)  
↓  
API Proxy Layer (Server Routes)  
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
- Spring Data JPA / Hibernate

Database:
- PostgreSQL (Neon)

Infrastructure:
- Vercel (frontend)
- Render (backend)

---

## Backend Design

The backend follows a layered architecture:

- Controller layer (HTTP handling)
- Service layer (business logic)
- Repository layer (data access)

Key aspects:
- RESTful API structure
- DTO-based request/response handling
- Centralized exception management
- Environment-driven configuration

---

## Security Considerations

Although simplified for demonstration purposes, the system includes practical security-oriented decisions inspired by real-world requirements:

- Rate limiting (Bucket4j) to mitigate abuse and automated submissions  
- Input validation using Jakarta Validation  
- Separation between public endpoints and internal routes  
- API proxy layer to avoid direct exposure of backend services  
- Environment variable isolation (no secrets in codebase)

These decisions reflect common backend protections used in production environments.

---

## Frontend Design

- App Router architecture (Next.js)
- Server-side API proxy to isolate backend communication
- Structured component system
- Controlled async state handling (loading / error)
- Clean separation between UI and data logic

---

## Core Functionality

- Lead creation and persistence
- Backend validation and error handling
- Controlled API exposure
- Integration between distributed services (frontend ↔ backend ↔ database)
- Production deployment across multiple platforms

---

## API Overview

POST   /api/v1/leads  
GET    /api/v1/leads  
GET    /api/v1/leads/{id}  
PATCH  /api/v1/leads/{id}/status  

Health:
GET /api/v1/health  
GET /actuator/health  

---

## Deployment

The system is deployed as a distributed architecture:

- Frontend: Vercel  
- Backend: Render  
- Database: Neon (serverless PostgreSQL)  

This setup reflects a typical modern cloud-based architecture.

---

## Engineering Focus

This project emphasizes:

- Backend system design with Java (Spring Boot)
- API architecture and integration
- Handling real-world deployment issues (CORS, proxies, environment configs)
- Secure data handling practices
- Debugging and production troubleshooting

---

## Author

Adnanne Bourhayal  
https://github.com/Adnanne-Bourhayal  

---

## Note

This repository is intended as a technical demonstration of engineering skills and architectural understanding, not as a commercial product.
