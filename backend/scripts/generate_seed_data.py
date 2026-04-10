import random
import datetime
import uuid

# Configuration
NUM_MENTORS = 200
NUM_LEARNERS = 800
NUM_TOTAL_USERS = NUM_MENTORS + NUM_LEARNERS
NUM_SKILLS = 100
NUM_SESSIONS = 500
ID_OFFSET = 10000  # Start from 10001 to avoid ANY chance of clashing with existing data

# Fixed salt/hash for "password123" (BCrypt)
PASSWORD_HASH = "$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TVuHOn2"

# Data Lists
FIRST_NAMES = ["John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Edward", "Fiona", "George", "Hannah", "Ivan", "Julia", "Kevin", "Laura", "Michael", "Nina", "Oscar", "Paula", "Quinn", "Rachel"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
SKILL_NAMES = [
    "Java", "Python", "React", "Angular", "Node.js", "Spring Boot", "Docker", "Kubernetes", "AWS", "Azure",
    "Machine Learning", "Data Science", "UI/UX Design", "Figma", "Digital Marketing", "SEO", "Project Management",
    "Agile", "Scrum", "SQL", "NoSQL", "MongoDB", "PostgreSQL", "Redis", "Kafka", "Microservices", "Security",
    "Penetration Testing", "Mobile Dev", "Flutter", "React Native", "Swift", "Kotlin", "Go", "Rust", "C++",
    "Embedded Systems", "Robotics", "Blockchain", "Solidity", "Smart Contracts", "FinTech", "HealthTech",
    "Public Speaking", "Leadership", "Negotiation", "Critical Thinking", "Writing", "E-commerce", "SaaS"
]
CATEGORIES = ["Programming", "Cloud", "Design", "Data", "Business", "Marketing", "Soft Skills", "Tools"]

def generate_sql():
    output = []
    
    # Disable foreign key checks to prevent lock-ups during bulk import
    output.append("SET FOREIGN_KEY_CHECKS = 0;")
    
    # 1. SKILLS (skill_skill)
    output.append("USE skill_skill;")
    # DELETE removed to preserve existing data
    skill_ids = list(range(ID_OFFSET + 1, ID_OFFSET + NUM_SKILLS + 1))
    for i in skill_ids:
        name_idx = (i - ID_OFFSET - 1)
        name = f"{random.choice(SKILL_NAMES)} {i}" if name_idx >= len(SKILL_NAMES) else SKILL_NAMES[name_idx]
        desc = f"Expert guidance on {name} and related technologies."
        cat = random.choice(CATEGORIES)
        pop = random.randint(0, 100)
        output.append(f"INSERT IGNORE INTO skills (id, skill_name, description, category, popularity_score, is_active, created_at, updated_at) VALUES ({i}, '{name}', '{desc}', '{cat}', {pop}, 1, NOW(), NOW());")

    # 2. USERS (skill_auth)
    output.append("\nUSE skill_auth;")
    user_ids = list(range(ID_OFFSET + 1, ID_OFFSET + NUM_TOTAL_USERS + 1))
    mentor_user_ids = user_ids[:NUM_MENTORS]
    learner_user_ids = user_ids[NUM_MENTORS:]
    
    for i in user_ids:
        role = "ROLE_MENTOR" if i <= (ID_OFFSET + NUM_MENTORS) else "ROLE_LEARNER"
        email = f"user{i}@skillsync.com"
        username = f"user{i}"
        output.append(f"INSERT IGNORE INTO users (id, email, password, username, role, auth_provider, is_active, created_at, updated_at) VALUES ({i}, '{email}', '{PASSWORD_HASH}', '{username}', '{role}', 'LOCAL', 1, NOW(), NOW());")

    # 3. USER PROFILES (skill_user)
    output.append("\nUSE skill_user;")
    for i in user_ids:
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"
        bio = f"Hi, I am {name}. Excited to be part of SkillSync!"
        phone = f"+91{random.randint(7000000000, 9999999999)}"
        email = f"user{i}@skillsync.com"
        username = f"user{i}"
        output.append(f"INSERT IGNORE INTO user_profiles (id, user_id, username, email, name, bio, phone_number, profile_complete, is_blocked, created_at, updated_at, rating, total_reviews) VALUES ({i}, {i}, '{username}', '{email}', '{name}', '{bio}', '{phone}', 1, 0, NOW(), NOW(), 0.0, 0);")

    # 4. MENTOR PROFILES (skill_mentor)
    output.append("\nUSE skill_mentor;")
    for i, user_id in enumerate(mentor_user_ids, ID_OFFSET + 1):
        spec = random.choice(SKILL_NAMES)
        exp = random.randint(2, 15)
        rate = float(random.randint(500, 5000))
        output.append(f"INSERT IGNORE INTO mentor_profiles (id, user_id, status, is_approved, specialization, years_of_experience, hourly_rate, availability_status, rating, total_students, created_at, updated_at) VALUES ({i}, {user_id}, 'APPROVED', 1, '{spec}', {exp}, {rate}, 'AVAILABLE', 4.5, 0, NOW(), NOW());")

    # 5. SESSIONS (skill_session)
    output.append("\nUSE skill_session;")
    session_statuses = ["REQUESTED", "ACCEPTED", "CONFIRMED", "COMPLETED", "CANCELLED"]
    
    mentor_stats = {uid: {"total_rating": 0, "review_count": 0, "students": set()} for uid in mentor_user_ids}
    
    sessions_data = []
    for i in range(ID_OFFSET + 1, ID_OFFSET + NUM_SESSIONS + 1):
        mid = random.choice(mentor_user_ids)
        lid = random.choice(learner_user_ids)
        sid = random.choice(skill_ids)
        status = random.choice(session_statuses)
        duration = random.choice([30, 60, 90, 120])
        sched_time = (datetime.datetime.now() + datetime.timedelta(days=random.randint(-30, 30))).strftime('%Y-%m-%d %H:%M:%S')
        
        output.append(f"INSERT IGNORE INTO sessions (id, mentor_id, learner_id, skill_id, scheduled_at, duration_minutes, status, created_at, updated_at) VALUES ({i}, {mid}, {lid}, {sid}, '{sched_time}', {duration}, '{status}', NOW(), NOW());")
        
        sessions_data.append({
            "id": i,
            "mentor_id": mid,
            "learner_id": lid,
            "status": status,
            "duration": duration
        })
        
        if status == "COMPLETED":
            mentor_stats[mid]["students"].add(lid)

    # 6. PAYMENTS (skill_payment)
    output.append("\nUSE skill_payment;")
    for s in sessions_data:
        saga_status = "COMPLETED" if s["status"] in ["CONFIRMED", "COMPLETED"] else "INITIATED"
        if s["status"] == "CANCELLED": saga_status = "REFUNDED"
        
        corr_id = str(uuid.uuid4())
        ref = f"PAY-{random.randint(100000, 999999)}"
        h_rate = 1000.0
        amount = (s["duration"] / 60.0) * h_rate
        output.append(f"INSERT IGNORE INTO payment_saga (id, session_id, correlation_id, learner_id, mentor_id, duration_minutes, hourly_rate, amount, status, payment_reference, created_at, updated_at) VALUES ({s['id']}, {s['id']}, '{corr_id}', {s['learner_id']}, {s['mentor_id']}, {s['duration']}, {h_rate}, {amount}, '{saga_status}', '{ref}', NOW(), NOW());")

    # 7. REVIEWS (skill_review)
    output.append("\nUSE skill_review;")
    review_count = ID_OFFSET + 1
    for s in sessions_data:
        if s["status"] == "COMPLETED":
            rating = random.randint(3, 5)
            comment = random.choice(["Greate session!", "Very helpful mentor", "Learned a lot", "Excellent technical depth", "Strongly recommend"])
            output.append(f"INSERT IGNORE INTO reviews (id, mentor_id, learner_id, session_id, rating, comment, is_anonymous, created_at, updated_at) VALUES ({review_count}, {s['mentor_id']}, {s['learner_id']}, {s['id']}, {rating}, '{comment}', 0, NOW(), NOW());")
            
            mentor_stats[s['mentor_id']]["total_rating"] += rating
            mentor_stats[s['mentor_id']]["review_count"] += 1
            review_count += 1

    # 8. SYNC RATINGS BACK TO PROFILES
    output.append("\n-- SYNCING RATINGS AND STUDENT COUNTS")
    for mid, stats in mentor_stats.items():
        if stats["review_count"] > 0:
            avg_rating = round(stats["total_rating"] / stats["review_count"], 1)
            output.append(f"UPDATE skill_mentor.mentor_profiles SET rating = {avg_rating}, total_students = {len(stats['students'])} WHERE user_id = {mid};")
            output.append(f"UPDATE skill_user.user_profiles SET rating = {avg_rating}, total_reviews = {stats['review_count']} WHERE user_id = {mid};")

    output.append("\nSET FOREIGN_KEY_CHECKS = 1;")
    return "\n".join(output)

import os

if __name__ == "__main__":
    sql_content = generate_sql()
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Save it one level up from 'scripts/', which is 'backend/'
    target_path = os.path.normpath(os.path.join(script_dir, "..", "seed_data.sql"))
    
    with open(target_path, "w") as f:
        f.write(sql_content)
    print(f"Successfully generated {target_path} with ID Offset: 10000 (Safety First!)")
