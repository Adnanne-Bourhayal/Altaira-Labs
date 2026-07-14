# Altaira Labs – Full Stack System

This repository contains a full-stack application developed to demonstrate real-world software engineering capabilities, with a focus on backend architecture, system design, security, and production deployment.

The project models a lead management workflow as a controlled environment to apply scalable and maintainable design patterns.

<img width="1440" height="849" alt="Captura de pantalla 2026-04-08 a las 23 40 37" src="https://github.com/user-attachments/assets/f0bb5934-65ae-4598-b5c6-1a100cbe1848" />


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
- BCrypt password hashing via Spring Security crypto

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

<img width="1440" height="814" alt="Captura de pantalla 2026-04-08 a las 23 44 21" src="https://github.com/user-attachments/assets/a1155eba-3596-4a1b-9b41-2a642fab56a5" />


---

## Security Considerations

Although simplified for demonstration purposes, the system includes practical security-oriented decisions inspired by real-world requirements:

- Rate limiting (Bucket4j) to mitigate abuse and automated submissions  
- Input validation using Jakarta Validation  
- Database-backed demo/admin users with BCrypt password hashes
- HTTP-only admin session cookies with hashed backend sessions
- Basic security event logging for login and user lifecycle events
- Minimal roles: admin, consultant, auditor
- Separation between public endpoints and internal routes  
- API proxy layer to avoid direct exposure of backend services  
- Environment variable isolation (no secrets in codebase)

These decisions reflect common backend protections used in production environments.

<img width="1440" height="849" alt="Captura de pantalla 2026-04-08 a las 23 41 01" src="https://github.com/user-attachments/assets/1eb388d9-fdd8-47fd-b2d3-9c7f999640e2" />


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
- Admin login and protected admin workspace
- Client and service management core
- Backend validation and error handling
- Controlled API exposure
- Integration between distributed services (frontend ↔ backend ↔ database)
- Production deployment across multiple platforms

---

## API Overview

POST   /api/v1/auth/login
GET    /api/v1/auth/me
POST   /api/v1/auth/logout
POST   /api/v1/leads  
GET    /api/v1/leads  
GET    /api/v1/leads/{id}  
PATCH  /api/v1/leads/{id}/status  
GET    /api/v1/clients
POST   /api/v1/clients
GET    /api/v1/services

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
