# SkillSync Frontend — Angular 18 SPA

> **Framework:** Angular 18 | **State:** NgRx Signal Store | **Styling:** Tailwind CSS + Angular Material | **Testing:** Karma + Jasmine

The SkillSync frontend is a Single Page Application (SPA) built with Angular 18, following a feature-module architecture with lazy loading. State is managed via **NgRx Signal Store** (`signalStore`). All API calls go through the backend API Gateway at port 9090.

---

## 🗂️ Project Structure

```
src/app/
├── app.component.ts             # Root shell
├── app.config.ts                # App-level providers (HttpClient, Router, etc.)
├── app.routes.ts                # Top-level routing with lazy-loaded feature modules
│
├── core/                        # Singleton services, stores, guards, interceptors
│   ├── guards/
│   │   └── auth.guard.ts        # authGuard + roleGuard (role-based CanActivate)
│   ├── interceptors/
│   │   └── jwt.interceptor.ts   # Adds "Authorization: Bearer <token>" to every request
│   ├── services/
│   │   ├── api.service.ts       # Base HTTP service
│   │   ├── auth.service.ts      # Auth API calls (/api/auth/*)
│   │   ├── user.service.ts      # User profile API calls (/api/users/*)
│   │   ├── mentor.service.ts    # Mentor API calls (/api/mentor/*)
│   │   ├── session.service.ts   # Session API calls (/api/session/*)
│   │   ├── skill.service.ts     # Skill API calls (/api/skills/*)
│   │   ├── group.service.ts     # Group API calls (/api/groups/*)
│   │   ├── review.service.ts    # Review API calls (/api/review/*)
│   │   ├── payment.service.ts   # Payment API calls (/api/payment/*)
│   │   ├── notification.service.ts  # Notification API calls (/api/notifications/*)
│   │   ├── messaging.service.ts # Messaging API calls (/api/messages/*)
│   │   ├── admin-user.service.ts    # Admin-specific user ops (block/unblock)
│   │   ├── theme.service.ts     # Dark/light mode management
│   │   ├── toast.service.ts     # Toast notification service
│   │   ├── profile-completion.service.ts # Profile completeness tracking
│   │   └── local-notification.service.ts # In-app notification badge
│   └── store/
│       ├── auth.store.ts        # Authentication state (NgRx Signal Store)
│       ├── mentor.store.ts      # Mentor browsing/search state
│       ├── session.store.ts     # Session lifecycle state
│       ├── skill.store.ts       # Skill catalog state
│       ├── payment.store.ts     # Payment saga state
│       └── notification.store.ts # Notification list state
│
├── features/                    # Feature modules (lazy loaded)
│   ├── auth/                    # Login, Register, OTP, ForgotPassword, ResetPassword
│   ├── mentors/                 # MentorList, MentorDetail, ApplyMentor
│   ├── sessions/                # MySessions, RequestSession, SessionDetail
│   ├── groups/                  # GroupList, GroupDetail (join/leave)
│   ├── reviews/                 # MentorReviews
│   ├── notifications/           # NotificationList
│   ├── payment/                 # Checkout (Razorpay SDK)
│   ├── profile/                 # ViewProfile, EditProfile
│   ├── skills/                  # SkillList
│   ├── messaging/               # ChatPage, ConversationList, MessageThread
│   ├── admin/                   # AdminUsers, PendingMentors, UserDetail, BlockUser
│   └── public/                  # Home (landing page, no auth required)
│
├── layout/                      # Shell layout components
│   ├── navbar/navbar.component.ts   # Top navigation (role-aware)
│   ├── sidebar/sidebar.component.ts # Side navigation
│   ├── shell/shell.component.ts     # Authenticated layout wrapper (navbar + sidebar + router-outlet)
│   └── theme-toggle/theme-toggle.component.ts
│
└── shared/                      # Reusable UI components and models
    ├── components/
    │   ├── pagination/pagination.component.ts  # Reusable pagination control
    │   ├── toast/toast.component.ts            # Toast notification UI
    │   ├── chat-drawer/chat-drawer.component.ts
    │   └── unauthorized/unauthorized.component.ts
    └── models/
        ├── page.models.ts       # Paginated response shape
        └── skill.models.ts      # Skill DTO shapes
```

---

## 🔐 Authentication Flow

```
Login → AuthStore.login() → POST /api/auth/login
  → Store JWT in localStorage
  → Store userId, email, roles in AuthStore signal state
  → Role-based redirect:
      ROLE_ADMIN   → /admin/users
      ROLE_MENTOR  → /mentor-dashboard
      ROLE_LEARNER → /mentors

JWT Interceptor: adds "Authorization: Bearer <token>" to every HTTP request

Token Refresh (on 401):
  → error.interceptor.ts detects 401
  → Calls authStore.refreshToken() → POST /api/auth/refresh
  → On success: retry original request
  → On failure: logout + redirect to /auth/login
```

---

## 🧭 Routing

| Path | Guard | Component / Feature |
|------|-------|---------------------|
| `/` | — | Home (public landing page) |
| `/auth/**` | — | Login, Register, OTP, ForgotPassword |
| `/mentors/**` | authGuard | Mentor list, detail, apply |
| `/sessions/**` | authGuard | Session booking, history, detail |
| `/skills/**` | authGuard | Skill catalog |
| `/groups/**` | authGuard | Study groups |
| `/reviews/**` | authGuard | Mentor reviews |
| `/notifications/**` | authGuard | Notification list |
| `/profile/**` | authGuard | View/edit profile |
| `/messages/**` | authGuard | Chat (messaging) |
| `/payment/**` | authGuard | Razorpay checkout |
| `/mentor-dashboard/**` | roleGuard(ROLE_MENTOR) | Mentor's session management |
| `/admin/**` | roleGuard(ROLE_ADMIN) | Admin panel (users, mentors) |
| `/unauthorized` | — | Access denied page |

---

## 🗃️ NgRx Signal Store (State Management)

| Store | State | Key Methods |
|-------|-------|-------------|
| `AuthStore` | `{token, userId, email, roles, loading, otpSent}` | `login()`, `logout()`, `register()`, `sendOtp()`, `verifyOtp()`, `googleLogin()`, `refreshToken()` |
| `MentorStore` | `{mentors, selectedMentor, pagination, loading}` | `loadMentors()`, `searchMentors()`, `applyAsMentor()` |
| `SessionStore` | `{sessions, currentSession, loading}` | `requestSession()`, `acceptSession()`, `rejectSession()`, `cancelSession()` |
| `SkillStore` | `{skills, loading}` | `loadSkills()` |
| `PaymentStore` | `{saga, loading}` | `createOrder()`, `verifyPayment()` |
| `NotificationStore` | `{notifications, unreadCount}` | `loadNotifications()`, `markAsRead()` |

---

## 🛠️ Key Commands

```bash
# Install dependencies
npm install

# Start development server (proxies /api → http://localhost:9090)
npm start       # http://localhost:4200

# Build for production
npm run build:prod

# Run unit tests with coverage
npm test -- --code-coverage --watch=false

# Lint
npm run lint
```

---

## 🧪 Testing

| Type | Framework | Coverage Target |
|------|-----------|-----------------|
| Unit Tests | Karma + Jasmine | > 85% (SonarCloud gate) |
| Linting | ESLint (strict TypeScript) | Zero errors on CI |

```bash
# Generate coverage report (opens in browser)
npm test -- --code-coverage --watch=false
# View: coverage/skillsync/index.html
```

---

## 🐳 Docker

```dockerfile
# Multi-stage build
Stage 1: Node 18 Alpine → ng build --configuration production
Stage 2: Nginx Alpine   → serves /dist from Stage 1

# docker-compose.yml (frontend/)
services:
  skillsync-frontend:
    build: .
    ports: ["80:80"]
    networks: [skillsync-proxy]
```

```bash
# Start frontend container
cd frontend
docker compose up -d
```

---

## ⚙️ Proxy Configuration (Development)

```json
// proxy.conf.json — proxies /api to backend API Gateway
{
  "/api": {
    "target": "http://localhost:9090",
    "changeOrigin": true,
    "secure": false
  }
}
```

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/core` | ^18.0.0 | Angular framework |
| `@ngrx/signals` | ^18.0.0 | Signal-based state management |
| `@angular/material` | ^18.0.0 | UI components |
| `rxjs` | ~7.8.0 | Reactive programming |
| `tailwindcss` | ^3.4.19 | Utility-first CSS |
| `typescript` | ~5.4.0 | Type safety |
| `karma` | ~6.4.0 | Test runner |
| `eslint` | ^9.39.1 | Linting |
