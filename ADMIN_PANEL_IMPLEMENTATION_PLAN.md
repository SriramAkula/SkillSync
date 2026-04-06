# Admin Panel Implementation Plan

## 📋 Executive Summary

Current admin panel only has:
- ✅ Mentor Application Approvals
- ✅ Skills Management

Missing features for comprehensive admin control:
- ❌ User Management (Block/Unblock, View ALL users)
- ❌ Statistics/Analytics Dashboard
- ❌ Dispute/Complaint Management
- ❌ Payment Issues Management
- ❌ Content Moderation
- ❌ Audit Logs
- ❌ System Settings

---

## 🏗️ PHASE 1: User Management (Priority: HIGH)

### 1.1 Backend Changes - User Service

#### New Database Fields (UserProfile Entity)
```java
@Column(nullable = false)
private Boolean isActive = true;          // Enable/Disable account

@Column(nullable = false)
private Boolean isBlocked = false;        // Block for violations

@Column
private String blockReason;               // Why blocked?

@Column
private LocalDateTime blockDate;          // When blocked?

@Column
private LocalDateTime unblockDate;        // When to auto-unblock? (null = manual)

@Column
private Long blockedBy;                   // Admin who blocked

@Column(nullable = false)
private Integer violationCount = 0;       // For tracking issues

@Column
private String notes;                     // Admin notes
```

#### New API Endpoints (UserProfileController)
```
[ADMIN ENDPOINTS] - All require ROLE_ADMIN

GET  /user/admin/all?page=0&size=20
     → Response: { success, data:[{userId, username, email, name, isActive, isBlocked, createdAt}], total }

GET  /user/admin/{userId}/details
     → Get full user details including block status, violation count, notes

PUT  /user/admin/{userId}/block
     Request: { reason: "Inappropriate behavior", unblockDate?: "2026-05-01" }
     → Response: UserProfileResponseDto

PUT  /user/admin/{userId}/unblock
     → Response: UserProfileResponseDto

PUT  /user/admin/{userId}/activate
     → Response: UserProfileResponseDto

PUT  /user/admin/{userId}/deactivate
     Request: { reason?: "Inactivity" }
     → Response: UserProfileResponseDto

GET  /user/admin/blocked
     → Get all blocked users with pagination
     → Response: List of blocked user profiles

GET  /user/admin/search?keyword=email/username&page=0&size=20
     → Search users by email, username, or name
```

#### Service Implementation (UserProfileService)
```java
// New methods
List<UserProfileResponseDto> getAllUsers(int page, int size);
UserProfileResponseDto blockUser(Long userId, String reason, LocalDateTime unblockDate);
UserProfileResponseDto unblockUser(Long userId);
UserProfileResponseDto activateUser(Long userId);
UserProfileResponseDto deactivateUser(Long userId);
List<UserProfileResponseDto> getBlockedUsers();
Page<UserProfileResponseDto> searchUsers(String keyword, int page, int size);
UserProfile getFullUserDetails(Long userId);  // Include notes, violations
```

---

## 🏗️ PHASE 2: Statistics & Analytics Dashboard (Priority: HIGH)

### 2.1 Create New AdminService in User Service

#### New Endpoints
```
GET  /user/admin/stats/overview
     → Response: {
         totalUsers: 1523,
         activeUsers: 1450,
         blockedUsers: 15,
         inactiveUsers: 58,
         totalMentors: 287,
         approvedMentors: 260,
         pendingMentors: 20,
         rejectedMentors: 7
       }

GET  /user/admin/stats/daily?days=30
     → Daily active users, registrations, sessions
     → Response: [{date: "2026-01-01", activeUsers: 120, newRegistrations: 5, sessions: 45}]

GET  /user/admin/stats/mentors
     → Mentor statistics from Mentor Service via Feign

GET  /user/admin/stats/skills
     → Top skills, usage stats

GET  /user/admin/stats/payments
     → Payment summary from Payment Gateway

GET  /user/admin/stats/disputes
     → Active disputes, resolved disputes
```

### 2.2 Service Layer
```java
public class AdminStatsService {
    public OverviewStats getOverviewStats();
    public List<DailyStats> getDailyStats(int days);
    public MentorStats getMentorStats();
    public SkillStats getSkillStats();
    public PaymentStats getPaymentStats();
    public DisputeStats getDisputeStats();
}
```

---

## 🏗️ PHASE 3: Mentor Management Enhancement (Priority: MEDIUM)

### 3.1 New Endpoints (Mentor Service)
```
GET  /mentor/admin/all?page=0&size=20
     → Get ALL mentors (not just pending)

GET  /mentor/admin/{id}/details
     → Full mentor details + sessions + reviews + rating

PUT  /mentor/admin/{id}/status
     Request: { status: "APPROVED|REJECTED|SUSPENDED|ACTIVE" }
     → Also sends notification email

PUT  /mentor/admin/{id}/notes
     Request: { notes: "Admin comments" }

GET  /mentor/admin/suspended
     → Get all suspended mentors

GET  /mentor/admin/stats
     → Mentor engagement stats
```

### 3.2 Enhanced Mentor Suspension
```
Current: suspendMentor (only sets status)
New: Should also:
  - Log reason
  - Track suspension date
  - Auto-notify learners of upcoming sessions
  - Mark affected sessions as CANCELLED
  - Refund pending sessions
```

---

## 🏗️ PHASE 4: Dispute & Complaint Management (Priority: MEDIUM)

### 4.1 New Service: Dispute Service (NEW)
```
Endpoints:
GET  /dispute/admin/all?status=OPEN
     → Filter: OPEN, RESOLVED, REJECTED

GET  /dispute/admin/{id}
     → Full dispute details

POST /dispute/admin/{id}/resolve
     Request: { resolution: "FAVOR_LEARNER|FAVOR_MENTOR|REFUND_FULL", notes: "..." }

GET  /dispute/admin/stats
     → Open disputes count, avg resolution time
```

### 4.2 Event Publishing
```
Service sends events:
- DisputeCreatedEvent
- DisputeResolvedEvent
→ Notification service listens and emails affected users
```

---

## 🏗️ PHASE 5: Content Moderation (Priority: LOW)

### 5.1 Flag/Report System
```
Endpoints (in respective services):
PUT  /mentor/admin/{id}/flag
     Request: { reason: "Inappropriate behavior", severity: "LOW|MEDIUM|HIGH" }

PUT  /review/admin/{id}/flag
     Request: { reason: "Fake review", severity: "HIGH" }

PUT  /group/admin/{id}/flag
     Request: { reason: "Spam content", severity: "MEDIUM" }

GET  /[service]/admin/flagged?severity=HIGH
     → Get flagged content
```

---

## 🏗️ PHASE 6: Audit Logs (Priority: MEDIUM)

### 6.1 New Table in User Service
```sql
CREATE TABLE admin_audit_logs (
    id BIGINT PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    admin_username VARCHAR(255),
    action VARCHAR(100),              -- BLOCK, UNBLOCK, APPROVE, REJECT, etc.
    entity_type VARCHAR(100),         -- USER, MENTOR, SKILL, etc.
    entity_id BIGINT,
    target_user_id BIGINT,            -- Who was affected
    reason TEXT,
    before_state JSON,                -- Previous values
    after_state JSON,                 -- New values
    timestamp DATETIME,
    INDEX (admin_id),
    INDEX (target_user_id),
    INDEX (timestamp)
);
```

### 6.2 Endpoints
```
GET  /user/admin/audit-logs?page=0&size=50
     → Filter by admin, entity_type, action, dateRange

GET  /user/admin/audit-logs/{userId}
     → All actions affecting specific user
```

---

## 🏗️ PHASE 7: Frontend Components

### 7.1 Admin Panel Navigation Restructure
```
Admin Panel
├── Dashboard (NEW)
│   ├── Overview Stats
│   ├── Daily Active Users Chart
│   ├── Recent Actions Feed
│   └── Alerts/Issues
├── Users (NEW)
│   ├── All Users List
│   ├── Search/Filter
│   ├── Block/Unblock User
│   ├── View Details
│   └── Audit History
├── Mentors (ENHANCED)
│   ├── All Mentors (was: pending only)
│   ├── Applications Queue
│   ├── Approve/Reject/Suspend
│   ├── Mentor Details
│   └── Engagement Stats
├── Skills (EXISTING)
│   ├── Create/Edit/Delete
│   └── Search
├── Disputes (NEW)
│   ├── Open Disputes
│   ├── Dispute Details
│   └── Resolve Dispute
├── Content Flagged (NEW)
│   ├── Flagged Mentors
│   ├── Flagged Reviews
│   └── Flagged Groups
├── Audit Logs (NEW)
│   ├── Filter by Admin
│   ├── Filter by User
│   ├── Timeline View
│   └── Export Logs
└── Settings (NEW)
    ├── Admin Users
    ├── System Config
    └── Notifications
```

### 7.2 New Components Needed
```
Frontend/src/app/features/admin/pages/
├── dashboard/
│   ├── dashboard.page.ts
│   ├── dashboard.page.html
│   ├── stats-card/stats-card.component.ts
│   ├── daily-chart/daily-chart.component.ts
│   └── recent-actions/recent-actions.component.ts
├── users/ (NEW)
│   ├── users-list.page.ts
│   ├── users-list.page.html
│   ├── user-detail-dialog.component.ts
│   └── user-actions.component.ts
├── mentors/ (ENHANCED)
│   ├── mentors-list.page.ts (was: pending-mentors)
│   ├── mentor-detail-dialog.component.ts
│   └── mentor-stats.component.ts
├── disputes/ (NEW)
│   ├── disputes-list.page.ts
│   ├── dispute-detail-dialog.component.ts
│   └── resolve-dispute-dialog.component.ts
├── content-moderation/ (NEW)
│   ├── flagged-content.page.ts
│   ├── flag-detail-dialog.component.ts
│   └── moderation-actions.component.ts
├── audit-logs/ (NEW)
│   ├── audit-logs.page.ts
│   ├── audit-filter-form.component.ts
│   ├── audit-timeline.component.ts
│   └── audit-export.service.ts
└── settings/ (NEW)
    ├── admin-settings.page.ts
    ├── admin-users.component.ts
    └── system-config.component.ts
```

### 7.3 New Services Required
```typescript
// frontend/src/app/core/services/admin/
admin.service.ts           // Main admin API calls
user-admin.service.ts      // User management
mentor-admin.service.ts    // Mentor management
dispute.service.ts         // Disputes
audit-log.service.ts       // Audit logs
admin-stats.service.ts     // Statistics
```

---

## 🎯 Implementation Sequence & Timeline

### Week 1: Phase 1 - User Management Backend
- [ ] Add UserProfile fields
- [ ] Create UserAdminController
- [ ] Implement UserAdminService
- [ ] Write tests
- **Estimate: 3-4 days**

### Week 1-2: Phase 2 - Analytics Backend
- [ ] Create AdminStatsService
- [ ] Feign clients for other services
- [ ] Statistics endpoints
- [ ] Implement caching for stats (Redis)
- **Estimate: 3 days**

### Week 2: Phase 1 & 2 - Frontend
- [ ] Create admin-stats service
- [ ] Dashboard component with charts
- [ ] Users management component with table/search/actions
- [ ] Block/Unblock dialogs
- **Estimate: 4-5 days**

### Week 3: Phase 3 - Mentor Enhancement
- [ ] New mentor endpoints
- [ ] Frontend mentor list enhancement
- [ ] Mentor details view
- **Estimate: 2-3 days**

### Week 3-4: Phase 4 - Disputes (IF needed)
- [ ] Create Dispute Service backend
- [ ] Dispute admin endpoints
- [ ] Frontend dispute management
- **Estimate: 3-4 days**

### Ongoing: Phase 5-7
- [ ] Content moderation (Low priority)
- [ ] Audit logs (Important but lower priority)
- [ ] Settings page (Last)

---

## 🔄 API Gateway Routes (REQUIRED)

Update `application-prod.yml` in api-gateway to route to new endpoints:

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-admin
          uri: http://user-service:8086
          predicates:
            - Path=/user/admin/**
          filters:
            - StripPrefix=1

        - id: mentor-admin
          uri: http://mentor-service:8083
          predicates:
            - Path=/mentor/admin/**
          filters:
            - StripPrefix=1

        - id: dispute
          uri: http://dispute-service:8095
          predicates:
            - Path=/dispute/**
          filters:
            - StripPrefix=1
```

---

## 📊 Database Migrations

### User Service
```sql
ALTER TABLE user_profiles ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE user_profiles ADD COLUMN is_blocked BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE user_profiles ADD COLUMN block_reason VARCHAR(500);
ALTER TABLE user_profiles ADD COLUMN block_date TIMESTAMP;
ALTER TABLE user_profiles ADD COLUMN unblock_date TIMESTAMP;
ALTER TABLE user_profiles ADD COLUMN blocked_by BIGINT;
ALTER TABLE user_profiles ADD COLUMN violation_count INT DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN notes TEXT;

CREATE TABLE admin_audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_id BIGINT NOT NULL,
    admin_username VARCHAR(255),
    action VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id BIGINT,
    target_user_id BIGINT,
    reason TEXT,
    before_state JSON,
    after_state JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_id (admin_id),
    INDEX idx_target_user (target_user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🔐 Security Considerations

1. **Authorization**: All `/admin/**` endpoints require `ROLE_ADMIN` header
2. **Audit Trail**: Log ALL admin actions (who, what, when, why)
3. **Rate Limiting**: Prevent admin abuse (max 100 requests/minute)
4. **IP Whitelisting**: Optional - restrict admin access to company IPs
5. **Password Policy**: Admins should have strong passwords (if local auth)
6. **Session Timeout**: Admin sessions should timeout after 30 mins of inactivity
7. **Two-Factor Auth**: Consider for admin accounts (future)

---

## ✅ Testing Strategy

### Backend
- [ ] Unit tests for each admin service method
- [ ] Integration tests with TestContainers for DB
- [ ] API tests for authorization checks
- [ ] Load tests for stats endpoints (caching)

### Frontend
- [ ] Component tests for admin pages
- [ ] Dialog/modal interaction tests
- [ ] Form validation tests
- [ ] Service mock tests

---

## 🚀 Rollout Plan

1. **Develop in feature branch**: `feature/admin-enhancement`
2. **Deploy to staging first** with test data
3. **Admin team reviews** before production
4. **Phased rollout**: Start with user management, then analytics
5. **Monitor logs** for any issues
6. **Gather feedback** and iterate

---

## 📝 Success Metrics

- [ ] All admin actions logged with timestamps
- [ ] Block/unblock works without downtime
- [ ] Dashboard loads in < 2 seconds (with caching)
- [ ] User search finds results in < 500ms
- [ ] No unauthorized access to admin endpoints
- [ ] Admin team reports 80%+ productivity increase

---

## 🎓 Training Needed

1. **Admin User Manual** - Screenshot guide for each feature
2. **Video Tutorials** - How to use each admin panel feature
3. **Escalation Process** - When to block vs. suspend vs. flag
4. **Audit Log Review** - How to investigate user issues

