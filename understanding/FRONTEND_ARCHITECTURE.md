# SkillSync — Frontend Architecture & Core Angular Concepts

> **Framework:** Angular 18 | **Environment:** Standalone Setup | **Last Updated:** April 2026

This document details the core, modern Angular architectures and design patterns used to build the SkillSync platform. It is formatted to provide conceptual definitions followed by practical implementation examples from the repository.

---

## 1. Standalone Components & Bootstrapping

### Concept Definition
Standalone components eliminate the need for `NgModules`. They allow components, pipes, and directives to specify their own dependencies (imports) directly within their `@Component` decorator. This dramatically reduces boilerplate, improves bundler tree-shaking, and makes the application more predictable.

### How it is Used in SkillSync
The entire SkillSync application is built using the Standalone API. The root application relies on `bootstrapApplication` rather than a traditional module array. Every UI component locally imports exactly what it needs (like `CommonModule` or specific Material modules).

### Where the Code Exists
- **Bootstrapping Layer:** `src/app/app.config.ts` uses `provideZoneChangeDetection`, `provideRouter`, and `provideHttpClient` to set up the app globally.
- **Component Layer:** `src/app/features/auth/pages/login/login.page.ts` sets `standalone: true` and explicitly defines its imports array `imports: [CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule...]`.
- **Layout Shell:** `src/app/layout/shell/shell.component.ts` locally imports `RouterOutlet` and custom standalone headers/sidebars.

---

## 2. NgRx SignalStore (Modern State Management)

### Concept Definition
NgRx SignalStore is a reactive state management solution specifically built for Angular Signals. It replaces traditional NgRx Stores and RxJS `BehaviorSubject` stores with a functional, declarative API (`signalStore`, `withState`, `withComputed`, `withMethods`) that feels synchronous inside the UI but perfectly handles asynchronous side effects via `rxMethod`.

### How it is Used in SkillSync
We use Signal Stores exclusively to decouple UI presentation from business logic. Each core feature area (Auth, Session, Mentor, Notifications) has its own independent, globally provided SignalStore. The stores hold variables mapped as signals, ensuring that UI components re-render precisely without Zone.js overhead when state mutates.

### Where the Code Exists
- **Feature Stores:** `src/app/core/auth/auth.store.ts` (manages JWTs, roles, logins)
- **Session Booking State:** `src/app/core/auth/session.store.ts` (manages learner/mentor scheduled sessions)
- **Notification Inbox:** `src/app/core/auth/notification.store.ts` (manages unread counts)
- **Method Invocation Example:** The `rxMethod` pipe inside `session.store.ts` uses RxJS `switchMap` to do the network call and seamlessly updates the UI via `patchState(store, ...)` using the `tapResponse` operator.

---

## 3. Angular Signals & Computed Properties

### Concept Definition
Signals are a wrapper around a value that can notify interested consumers when that value changes. They are the new reactive primitive in Angular, drastically outperforming RxJS streams for UI data binding. **Computed signals** automatically derive their output based on other signals and proactively cache the result.

### How it is Used in SkillSync
Signals drive local UI state changes (like toggling menus, revealing passwords, parsing themes) and expose global state from our `SignalStores`. Computed signals are heavily utilized to calculate permissions, filters, and display logic safely.

### Where the Code Exists
- **Derived State:** In `src/app/core/auth/auth.store.ts`, `isAdmin: computed(() => store.roles().includes('ROLE_ADMIN'))` derives the admin boolean automatically anytime the `roles` array signal changes.
- **Local Component State:** In `src/app/layout/shell/shell.component.ts`, `readonly isCollapsed = signal(false);` controls the sidebar UI.
- **Theming:** In `src/app/core/services/theme.service.ts`, `theme = signal<Theme>('light-theme');` tracks the global dark/light appearance.

---

## 4. Functional HTTP Interceptors (with Silent Token Refresh)

### Concept Definition
Interceptors sit between the browser and the backend API, allowing you to catch, mutate, or block HTTP requests and responses globally. With Angular 18, interceptors became lightweight functions (`HttpInterceptorFn`) rather than heavier class-based injectables.

### How it is Used in SkillSync
Our interceptor is the backbone of the application's security mechanism. It normalizes environment URLs, injects the `Authorization: Bearer <JWT>` header automatically, and crucially handles 401 Unauthorized errors by queueing failed requests using a `BehaviorSubject`, silencing the UI, rotating the refresh token, and re-playing the queued network requests.

### Where the Code Exists
- **Interceptor Logic:** `src/app/core/interceptors/jwt.interceptor.ts`
- **Application Wiring:** `src/app/app.config.ts` registers the function natively utilizing `provideHttpClient(withInterceptors([jwtInterceptor]))`.

---

## 5. Functional Route Guards

### Concept Definition
Route Guards protect application paths from malicious or accidental navigation by unauthorized users. Similar to interceptors, modern route guards transitioned from class-based implements (`CanActivate`) to functional parameters (`CanActivateFn`).

### How it is Used in SkillSync
Guards are tightly integrated with the Application Routing Tree and the custom `AuthStore`. They synchronously check the User Claims (JWT state) and dynamically redirect to login forms or custom "unauthorized access" pages based on their permission matrix (e.g., stopping Learners from viewing Mentor Dashboards).

### Where the Code Exists
- **Guard Functions:** `src/app/core/guards/auth.guard.ts` (defines both `authGuard` and `roleGuard`).
- **Route Application:** `src/app/app.routes.ts` where we restrict parent paths: `canActivate: [roleGuard('ROLE_MENTOR')]`.

---

## 6. Route Lazy Loading (Code Splitting)

### Concept Definition
Lazy loading defers the initialization and downloading of UI modules/components until the user physically navigates to that route. This aggressively downsizes the initial app bundle payload, significantly optimizing the First Contentful Paint (FCP) and Time to Interactive (TTI) web metrics.

### How it is Used in SkillSync
Because of Standalone Components, we don't load huge Feature Modules. Instead, we use modern `loadComponent` and `loadChildren` promises tied directly to dynamic `import()` statements inside the route trees.

### Where the Code Exists
- **Routing Base:** `src/app/app.routes.ts`. Instead of eagerly loading dashboards, we map paths like `loadChildren: () => import('./features/sessions/sessions.routes').then(m => m.SESSION_ROUTES)`. None of the components associated with booking are loaded until the user clicks "Sessions".

---

## 7. RxJS Operators (Data Orchestration)

### Concept Definition
RxJS revolves around Reactive Streams (Observables). Operators are pure functions used to transform, filter, merge, or catch these asynchronous data streams before they reach the subscriber.

### How it is Used in SkillSync
While Signals handle our *UI State*, **RxJS perfectly handles our *Network State***. Since the SkillSync backend is heavily microservice-based without physical foreign DB keys mapping mentors to sessions, the frontend acts as the orchestrator to stitch relational records together using advanced stream merging.

### Where the Code Exists
- **Data Stitching & ForkJoin:** `src/app/core/services/session.service.ts` uses `forkJoin` and `switchMap` to fetch a list of sessions, and then simultaneously fires off background requests to fetch the 'Mentor Profile' from the `UserService` and the 'Skill Details' from the `SkillService`. The data is aggregated into a final DTO before handing it over to the UI.
- **Short Polling:** `src/app/core/auth/notification.store.ts` uses the `interval(ms)` operator mapped to a REST API to silently simulate WebSockets and fetch unread events.

---

## 8. Reactive Forms

### Concept Definition
Reactive Forms provide a highly structured, immutable, synchronous approach to managing form state. They use strongly typed Typescript objects (`FormGroup`, `FormControl`) explicitly declared in the component payload rather than implicitly attached inside the HTML template.

### How it is Used in SkillSync
Forms are robust and type-safe. We define validations (`Validators.required`, `Validators.email`) locally in the UI controller so unit tests can directly simulate invalid inputs. Form values are extracted synchronously using `.getRawValue()`.

### Where the Code Exists
- **The Engine:** We use the `FormBuilder` (injectable construct) across the entire platform.
- **Implementations:** `src/app/features/auth/pages/login/login.page.ts` dynamically binds the email and password parameters leveraging `FormGroup` structures mapped to Material `<form [formGroup]="form">` bindings in the HTML layer.
