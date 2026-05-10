# SkillSync — Documentation Index

> **Generated:** May 2026 | **Platform:** Mentor-Learner Microservices | **Stack:** Spring Boot 3.4.11 + Angular 18 + Docker

---

## 📚 Documentation Suite

| # | Document | Contents | Diagrams |
|---|----------|----------|---------|
| 1 | [Use Case Analysis](./1_Use_Case_Analysis.md) | Actors, use cases, interaction matrix | ✅ UML Use Case Diagram (Mermaid) |
| 2 | [High Level Design](./2_High_Level_Design.md) | System overview, FR/NFR, layers, communication, security | ✅ System layering diagram |
| 3 | [Architecture Diagram](./3_Architecture_Diagram.md) | Full system architecture, Docker networks, CI/CD pipeline | ✅ 4 Mermaid diagrams |
| 4 | [Low Level Design](./4_Low_Level_Design.md) | Module structures, API contracts, CQRS, sequence diagrams, state machines | ✅ 5 Mermaid diagrams |
| 5 | [Database Design](./5_Database_Design.md) | All entity schemas, ER diagram, constraints, Redis keys | ✅ Full ER Diagram (Mermaid) |
| 6 | [Technical Documentation](./6_Technical_Documentation.md) | Repo structure, config, CI/CD, observability, testing, integration points | ✅ Reference tables |

---

## 🏗️ System Quick Reference

| Service | Port | Database |
|---------|------|----------|
| API Gateway | 9090 | — |
| Auth Service | 8081 | `skill_auth` |
| User Service | 8082 | `skill_user` |
| Skill Service | 8083 | `skill_skill` |
| Session Service | 8084 | `skill_session` |
| Mentor Service | 8085 | `skill_mentor` |
| Group Service | 8086 | `skill_group` |
| Review Service | 8087 | `skill_review` |
| Notification Service | 8088 | `skill_notification` |
| Payment Gateway | 8089 | `skill_payment` |
| Messaging Service | 8090 | ⏳ Under Development |
| Config Server | 8888 | Git repo |
| Eureka Server | 8761 | In-memory |

---

*All documentation generated from static analysis of the SkillSync source code, entity classes, controllers, configuration files, and existing documentation in `/understanding`.*
