# GAMIFIED STUDENT LEARNING PLATFORM — FULL-STACK HACKATHON PROJECT

## 0. PROJECT INSTRUCTIONS

Build a complete, real, full-stack gamified student learning platform.

**Important:** If an existing project/repository is present, inspect the existing frontend, backend, database, routes, components, and configuration first. Preserve the existing working stack and functionality where possible. Do not blindly rewrite the project.

The application must be a real working application, not a static UI mockup.

All important data must be persisted in the database.

Do not use:
- Fake dashboard data
- Hard-coded student names
- Demo users automatically shown
- Fake progress values
- Random AI feedback
- Fake coding execution
- Client-only authentication
- Client-only role checks
- Mock mentor relationships
- Fake test results

Implement proper:
- Authentication
- Authorization
- Database persistence
- Role-based access control
- API validation
- Notifications
- Progress tracking
- Gamification
- Coding execution/evaluation
- Mentor-student relationships
- Assignments
- AI performance analysis

---

# 1. FIRST PAGE — LOGIN / SIGNUP

The first screen must be an authentication page.

Do not directly show the dashboard.

Do not automatically log in a demo user.

Do not show fake names such as:
- Alex
- John
- Demo Student
- Sample User

## Role Selection

Before authentication, allow the user to choose:

- STUDENT
- MENTOR

Then show:

- Login
- Sign Up

## Sign Up Fields

For both roles:

- Name
- Email
- Password
- Confirm Password

## Authentication Requirements

Implement real:

- Registration
- Login
- Logout
- Password hashing
- Password validation
- Duplicate-email validation
- Protected routes
- Session/JWT authentication
- Role-based authorization
- Server-side validation
- Proper error messages

After login:

- Student → Student Dashboard
- Mentor → Mentor Dashboard

---

# 2. USE THE REAL USER NAME

The application must always use the authenticated user's actual database name.

Never hard-code names.

Example:

If the registered user is:

`Jenifer`

Dashboard should display:

`Welcome, Jenifer`

The name must come from the authenticated user/database.

---

# 3. NEW USER MUST START FROM ZERO

When a student registers, create a clean student profile.

Default values:

```text
XP = 0
Level = 1
Skill Coins = 0
Current Streak = 0
Longest Streak = 0
Completed Tasks = 0
Completed Topics = 0
Completed Courses = 0
Badges = 0
Challenges Completed = 0
Python Progress = 0%
C Progress = 0%
C++ Progress = 0%
Mentor = Not Connected
```

Do not prefill fake progress.

Do not give fake XP.

Do not give fake badges.

Do not show fake activity.

---

# 4. EXISTING USERS MUST CONTINUE FROM DATABASE

When an existing student logs in again:

- Load their actual progress
- Load actual XP
- Load actual level
- Load actual streak
- Load actual badges
- Load actual courses
- Load actual completed tasks
- Load actual coding attempts
- Load actual quiz attempts
- Load actual mentor relationship
- Load actual assignments
- Load actual team
- Load actual rewards

The user must continue exactly from where they stopped.

---

# 5. STUDENT DASHBOARD

Create a student dashboard using the authenticated student's real data.

## Dashboard Header

Show:

- Welcome message
- Student name
- XP
- Level
- Streak
- Skill Coins
- Badges
- Completed Courses

## Main Sections

Include:

### Continue Learning

Show the next available topic/course.

### My Courses

Show enrolled courses and actual progress.

### Daily Challenge

Show today's real challenge.

### Weekly Challenge

Show current weekly challenge.

### XP Progress

Display actual XP toward the next level.

### Current Level

Display the student's calculated level.

### Streak

Display current streak and longest streak.

### Badges

Display earned badges.

### Achievements

Display completed achievements.

### Mentor

Display:

- Mentor Not Connected
- Pending Mentor Request
- Connected Mentor

### AI Learning Recommendation

Generate recommendations based on actual performance.

### Recent Activity

Show actual recent activity from the database.

---

# 6. STUDENT SIDEBAR

Student navigation:

```text
Dashboard

Learn
 ├── Course Library
 ├── My Courses
 ├── Learning Progress
 └── Badges

Challenges
 ├── Daily Challenge
 ├── Weekly Challenge
 └── Team Challenges

Rewards
 ├── Skill Coins
 ├── Reward Shop
 ├── Power-Ups
 └── Achievements

Mentor
 ├── Mentor Requests
 ├── My Mentor
 └── Mentor Feedback

AI
 ├── AI Learning Assistant
 └── AI Performance

Profile

Logout
```

## Important Mentor Rule

Students must NOT search for mentors and send mentor requests.

Students only:

- Receive mentor requests
- View mentor request details
- Accept mentor request
- Decline mentor request
- View their connected mentor after acceptance
- Receive mentor feedback
- Receive mentor assignments/tests from an authorized connected mentor

---

# 7. MENTOR DASHBOARD

Mentors must have a completely separate dashboard.

## Dashboard Statistics

Show actual data:

- Total Students
- Active Students
- Average Progress
- Average Accuracy
- Students Needing Attention

## Mentor Navigation

```text
Dashboard

My Students

Mentor Requests

Assignments / Tests
 ├── Create Quiz
 ├── Create Coding Challenge
 ├── My Assignments
 └── Assignment Results

Student Analytics

Feedback

Challenges
 ├── Create Quiz
 └── Create Coding Challenge

AI Insights

Mentor Profile

Logout
```

Mentors must NOT see student-only navigation.

---

# 8. MENTOR STUDENT MONITORING

A mentor can see detailed student information ONLY after the student accepts the mentor request.

Before acceptance, the mentor must NOT see:

- Detailed progress
- XP history
- Quiz accuracy
- Coding submissions
- Weak topics
- Strong topics
- Streak history
- AI performance analysis
- Private learning activity

After acceptance, the mentor can see:

- Student Name
- Course
- Progress
- XP
- Level
- Streak
- Accuracy
- Status
- Course progress
- Topic progress
- Quiz performance
- Wrong answers
- Coding attempts
- Coding accuracy
- Daily challenge performance
- Weekly challenge performance
- Team performance
- Strong topics
- Weak topics
- AI insights
- Mentor feedback history
- Recent activity

---

# 9. CORRECT MENTOR CONNECTION FLOW

This is an important business rule.

## Student DOES NOT send a mentor request.

The flow must be:

```text
Mentor searches for students
        ↓
Mentor selects student
        ↓
Mentor sends mentor request
        ↓
Student receives notification
        ↓
Student opens Mentor Requests
        ↓
Student views mentor information
        ↓
Student ACCEPTS or DECLINES
        ↓
If ACCEPTED
        ↓
Mentor ↔ Student relationship becomes ACTIVE
        ↓
Mentor can view detailed student analytics
```

## New Student

Every new student starts with:

```text
Mentor = Not Connected
```

---

# 10. MENTOR REQUEST SYSTEM

Create a real database-backed mentor request system.

## Mentor Can:

- Search students
- Search by name
- Search by course
- Search by learning level
- Search by skill/badges
- Filter students
- Select a student
- Send mentor request

Mentor request must contain:

- Mentor ID
- Student ID
- Mentor name
- Mentor expertise
- Mentor experience
- Mentor availability/capacity
- Message
- Status
- Created timestamp

Possible statuses:

```text
PENDING
ACCEPTED
DECLINED
CANCELLED
EXPIRED
```

## Student Request Screen

Show:

- Mentor name
- Expertise
- Experience
- Availability
- Message
- Accept button
- Decline button

## If Student Accepts

Create active relationship:

```text
Mentor ↔ Student = ACTIVE
```

Then:

- Student sees My Mentor
- Mentor sees student under My Students
- Detailed analytics become available
- Mentor can provide feedback
- Mentor can send assignments/tests

## If Student Declines

Relationship must NOT become active.

Mentor must NOT get access to detailed student analytics.

---

# 11. COURSE LIBRARY

Include:

- Python
- C
- C++
- Java
- Web Development
- Machine Learning

For a new student:

- Python can be available initially.
- Other courses can be locked according to progression rules.

All course information must be stored in the database.

---

# 12. PYTHON COURSE — 16 LEVELS

Create the following 16 levels:

```text
Level 1  - Variables & Data Types
Level 2  - Input & Output
Level 3  - Operators
Level 4  - Conditional Statements
Level 5  - Loops
Level 6  - Functions
Level 7  - Strings
Level 8  - Lists
Level 9  - Tuples
Level 10 - Sets
Level 11 - Dictionaries
Level 12 - File Handling
Level 13 - Exception Handling
Level 14 - Modules
Level 15 - OOP
Level 16 - Advanced Python + Final Assessment
```

Store all levels/topics in the database.

The architecture must allow adding more courses and levels later.

---

# 13. TOPIC PROGRESSION

Level 1 must initially be unlocked.

Future levels must be locked.

Example:

```text
Level 1 → UNLOCKED
Level 2 → LOCKED
Level 3 → LOCKED
...
```

After the student actually completes the required Level 1 activities:

```text
Level 2 → UNLOCKED
```

Use real completion rules.

Do not allow the frontend to simply mark a level as complete.

---

# 14. DETAILED LEARNING CONTENT

Each topic should provide:

- Concept
- Detailed explanation
- Examples
- Code examples
- Expected output
- Common mistakes
- Practice questions
- Coding tasks
- Assessment
- Completion tracking

Example:

## Variables & Data Types

Explain:

- Variables
- Integers
- Floats
- Strings
- Booleans
- Type conversion
- `type()`

Example:

```python
name = "Jenifer"
age = 19
height = 152.0
student = True
```

Show explanation and output.

Track which lessons/topics the student has completed.

---

# 15. PRACTICE MODE

Each topic can contain:

- MCQ
- Output Prediction
- Fill in the Code
- Debugging
- Coding Challenge
- Concept Questions

When the student submits:

Show:

- Correct / Incorrect
- Correct answer where appropriate
- Explanation
- XP earned
- Progress update

Store every attempt in the database.

Do not award duplicate completion XP for repeatedly submitting the same completed activity unless the configured rules explicitly allow it.

---

# 16. REAL CODE EDITOR

Implement a real coding environment.

Use a suitable editor such as Monaco Editor if supported by the existing stack.

Features:

- Editable code
- Syntax highlighting
- Language selection
- Run
- Submit
- Reset
- Clear
- Input area
- Output area
- Error area
- Test case results

The coding experience should feel similar to platforms such as LeetCode.

---

# 17. REAL LEETCODE-STYLE CODE EXECUTION

This is a major requirement.

Students must be able to solve programming problems by writing code.

Do NOT make programming challenges into only MCQs.

## Problem Page

Show:

- Problem title
- Problem statement
- Input format
- Output format
- Constraints
- Examples
- Difficulty
- Topic
- Function signature or expected input format

## Test Cases

Support:

### Public Test Cases

Students can see:

```text
Input
Expected Output
```

### Hidden Test Cases

Hidden from students.

Hidden test cases must remain server-side.

## Run

When the student clicks:

`Run`

Evaluate the code against public/sample test cases.

Show:

- Passed
- Failed
- Actual output
- Expected output where appropriate
- Runtime error
- Compilation error
- Time limit exceeded

## Submit

When the student clicks:

`Submit`

Evaluate against:

- Public test cases
- Hidden test cases

Show:

```text
Passed: 8/10
Failed: 2/10
Score: 80%
```

Do not reveal hidden test case inputs or expected outputs.

## Store Submission Data

Store:

- Student ID
- Problem ID
- Course
- Level
- Code
- Language
- Attempt number
- Passed test cases
- Total test cases
- Score
- Execution time
- Memory usage if available
- Status
- Error
- Timestamp

## Security

NEVER execute untrusted student code directly inside the main application server.

Use a secure sandbox/container/isolated execution service with:

- CPU limit
- Memory limit
- Execution timeout
- Restricted filesystem
- Restricted network access
- Process isolation
- Resource limits

The architecture should allow support for:

- Python
- C
- C++
- Java

If only Python is implemented initially, structure the system so other languages can be added later.

---

# 18. XP SYSTEM

XP must be earned from real activity.

Example configuration:

```text
Easy Challenge       +5 XP
Medium Challenge    +10 XP
Hard Challenge      +20 XP
Topic Completion    +50 XP
Daily Challenge     +30 XP
Weekly Challenge   +100 XP
Course Completion  +100 XP
```

These values should be configurable.

## XP Rules

- No fake XP
- No duplicate XP
- Every XP change must have a transaction
- XP history must be stored
- Total XP should be derived safely from transactions or maintained consistently

Example transaction:

```text
Student
Activity
XP amount
Reason
Timestamp
```

---

# 19. LEVEL SYSTEM

Use configurable XP thresholds.

Initial example:

```text
0–499       Level 1
500–999     Level 2
1000–1999   Level 3
2000–2999   Level 4
3000+       Level 5
```

Automatically calculate level from XP.

When a student levels up:

- Update level
- Show level-up animation
- Store level-up event
- Update dashboard

Do not allow students to manually change their level.

---

# 20. DAILY STREAK SYSTEM + AI STREAK RESTORE

A streak must be based on meaningful learning activity, not simply logging in.

Meaningful activity may include:

- Completing a lesson
- Completing a practice activity
- Solving a coding problem
- Completing a daily challenge
- Completing a quiz

Track:

- Current streak
- Longest streak
- Daily activity
- Streak history

Milestones:

```text
7 Days
14 Days
30 Days
```

Award achievements/badges when applicable.

## Streak Break

If the student misses one eligible learning day:

```text
Previous Streak = 10
Missed Day = 1
Streak = Broken
```

Do not silently keep the streak alive.

## AI Streak Restore Task

After a streak is broken, the student can receive an AI-generated streak restore task.

The task must be based on actual student information such as:

- Current course
- Current level
- Weak topic
- Recent mistakes
- Recent coding performance
- Recent quiz performance

Example:

```text
Your recent Python performance shows difficulty with loops.

Complete this AI-generated loops challenge to restore your streak.
```

If the student passes the restore task:

```text
Restore successful
Previous eligible streak restored
```

The exact restoration rule must be configurable.

## Anti-Abuse Rules

Implement rules such as:

- One restore attempt per eligible missed day
- Do not generate unlimited restore tasks
- A restore task must actually be passed
- Store every restore attempt
- A restore task cannot be reused indefinitely
- Restore XP must not be exploitable for infinite farming

A student may also use a valid `Restore Card` if they own one.

---

# 21. BADGE SYSTEM

Create reusable badges.

Examples:

```text
First Challenge
7-Day Learner
Perfect Score
Python Master
Coding Streak
Weekly Winner
Team Champion
```

Badge conditions must be evaluated from real data.

Do not manually assign badges.

Store:

- Badge ID
- Student ID
- Condition
- Earned timestamp

---

# 22. DAILY CHALLENGE

Create a real daily challenge.

The challenge should be appropriate to:

- Current course
- Current level
- Current topic
- Student performance where appropriate

Store:

- Challenge
- Date
- Student
- Submission
- Result
- XP
- Completion timestamp

Do not allow unlimited duplicate rewards for the same daily challenge.

---

# 23. WEEKLY CHALLENGES

Create:

### Individual Weekly Challenge

Rewards can include:

- XP
- Skill Coins
- Badges
- Achievements

### Team Weekly Challenge

Rewards can include:

- XP
- Skill Coins
- Power-Ups
- Badges
- Trophy
- Scratch Card

Track actual participation and results.

---

# 24. TEAM / GROUP SYSTEM

Students can form learning teams.

## Maximum Members

A team can contain:

**Maximum 5 members.**

Never allow more than 5 active members.

## Team Formation

Students should be able to form/join teams based on comparable:

- Course
- Level
- Skill
- Badges
- Performance range

Avoid creating unfair teams by mixing completely unrelated skill levels when the competition rules do not allow it.

## Team Features

Each team should have:

- Team name
- Team members
- Team level
- Course
- Team badges
- Team score
- Team progress
- Team challenges
- Team history

Track:

- Correct answers
- Completed challenges
- Individual contribution
- Team score
- Attempts
- Results

Do not calculate the winner only by speed.

---

# 25. TEAM COMPETITION + SCRATCH CARD REWARD

Teams can compete against other eligible teams.

Competition can include:

- Coding challenges
- Quiz challenges
- Problem-solving challenges
- Weekly challenges

Store:

- Team match
- Participating teams
- Scores
- Contributions
- Results
- Winner
- Timestamp

## Winning Team

When a team wins a competition, eligible winning members receive a scratch-card reward opportunity.

Default rule:

```text
Each eligible winning team member receives 1 scratch-card token.
```

Make the rule configurable.

## Scratch Card

Create an interactive scratch-card UI.

The reward outcome must be determined securely by the backend before/while revealing it.

Do not allow the client to manipulate the reward.

Required reward types:

### Hint Card

Can be used in a future eligible challenge/match to reveal a hint.

### Restore Card

Can be used to restore an eligible one-day streak.

### Skip Card

Can be used to skip one eligible programming task/problem.

A Skip Card must not create an XP exploit.

All scratch-card results must be stored.

Example:

```text
Scratch Card
      ↓
Backend determines reward
      ↓
Student scratches card
      ↓
Reward revealed
      ↓
Reward added to inventory
```

---

# 26. REWARD SYSTEM

Use two separate concepts:

## XP

Used for:

- Progression
- Leveling

## Skill Coins

Used for:

- Reward Shop
- Power-Ups
- Special rewards

Example:

```text
Complete Activity       +10 Coins
Help Another Student    +10 Coins
Weekly Challenge        +50 Coins
```

Reward Shop examples:

```text
Hint                  100 Coins
Retry                 200 Coins
Power-Up              300 Coins
Special Challenge     500 Coins
```

Make prices configurable.

Store all coin transactions.

---

# 27. POWER-UPS

Support power-ups such as:

- Hint Power
- Extra Time
- Skip Question
- Double XP
- Retry
- Hint Card
- Restore Card
- Skip Card

Every power-up must have:

- Ownership
- Quantity
- Usage rules
- Expiration if applicable
- Transaction history

A student cannot use a power-up they do not own.

Prevent duplicate reward exploits.

---

# 28. AI LEARNING ASSISTANT

Create an AI Learning Assistant.

It should understand the student's current context.

The AI should consider:

- Current course
- Current topic
- Current level
- Recent mistakes
- Recent questions
- Coding attempts
- Quiz performance

Example:

Instead of generic:

> Practice more Python.

Give context-aware feedback such as:

> You are currently learning Python loops. Your recent attempts show difficulty with nested loops. Try practicing one simple nested-loop problem before moving to the next topic.

The AI should guide the student rather than blindly completing assessments for them.

---

# 29. CONTEXT-AWARE AI

AI responses should use real application context.

Possible context:

```text
Current Course
Current Level
Current Topic
Recent Mistakes
Quiz Accuracy
Coding Accuracy
Attempt Count
Completion Rate
Streak
XP
Weak Topics
Strong Topics
Challenge Performance
```

Do not generate random generic advice.

Do not claim a student is weak in a topic unless the stored data supports it.

---

# 30. DEDICATED AI PERFORMANCE / AI INSIGHTS MENU

Create ONE dedicated AI menu:

```text
AI Performance
```

or

```text
AI Insights
```

This menu must exist throughout the student's learning journey.

Do not create separate disconnected AI feedback pages for every level.

The same AI Performance section should analyze all completed/current levels.

---

# 31. WEEK-BY-WEEK AI PERFORMANCE COMPARISON

This is a critical requirement.

AI performance analysis must be based on real stored performance.

## Week 1

Generate a baseline analysis.

Example metrics:

```text
Quiz Accuracy
Coding Accuracy
Tasks Completed
Average Attempts
Average Coding Time
XP Earned
Topics Completed
Strong Topics
Weak Topics
Streak
Challenge Performance
```

Week 1 should be treated as the baseline.

## Week 2

Do NOT generate an unrelated analysis.

Compare:

```text
Week 2 vs Week 1
```

Example:

```text
Quiz Accuracy:
Week 1 = 62%
Week 2 = 74%
Change = +12%

Coding Accuracy:
Week 1 = 55%
Week 2 = 68%
Change = +13%
```

Then AI explains the improvement/change based on actual data.

## Week 3

Compare:

```text
Week 3 vs Week 2
```

Continue this pattern.

## Every Week

The system must support:

```text
Week N vs Week N-1
```

Optionally also show:

```text
Overall trend
```

## Every Level

The same weekly comparison system must work across all course levels.

Example:

```text
Python
 ├── Level 1
 │    ├── Week 1
 │    ├── Week 2 vs Week 1
 │    └── Week 3 vs Week 2
 │
 ├── Level 2
 │    ├── Week 1
 │    ├── Week 2 vs Week 1
 │    └── Week 3 vs Week 2
```

If there is insufficient data:

```text
Not enough data for a meaningful comparison yet.
```

Do NOT fabricate numbers.

## AI Performance Output

Show:

- What improved
- What decreased
- Strong topics
- Weak topics
- Recommended next topics
- Coding improvement
- Quiz improvement
- Attempt trends
- Streak trends
- Challenge performance
- Personalized action plan

Store the generated analysis in the database.

Store:

- Student ID
- Course
- Level
- Week
- Metrics
- Previous week metrics
- AI analysis
- Recommendations
- Model/version if available
- Created timestamp

---

# 32. ADAPTIVE LEARNING

The platform should recommend what the student should learn next.

Recommendations should be based on:

- Accuracy
- Failed questions
- Coding failures
- Attempt count
- Time spent
- Weak topics
- Completed topics
- Current level

Example:

```text
Your accuracy in Functions is 58%.

Recommended:
Practice Functions → Easy Coding → Medium Coding
```

Do not unlock advanced content simply because a student clicked a button.

---

# 33. MENTOR FEEDBACK

Connected mentors can provide feedback to connected students.

Mentor feedback fields:

```text
Student ID
Mentor ID
Course
Topic
Task
Feedback
Timestamp
```

Only active mentor-student relationships can access this feature.

Students should be able to see mentor feedback.

---

# 34. MENTOR-CREATED QUIZZES AND CODING CHALLENGES

Mentors must be able to create real assessments.

## Mentor Can Create:

### Quiz

Fields:

- Title
- Description
- Course
- Level
- Topic
- Difficulty
- Questions
- Options
- Correct answers
- Explanation
- Time limit
- Due date

### Programming Challenge

Fields:

- Problem title
- Problem statement
- Input format
- Output format
- Constraints
- Examples
- Difficulty
- Course
- Level
- Topic
- Supported language
- Starter code
- Public test cases
- Hidden test cases
- Time limit
- Memory limit
- Due date

Programming challenges must use the same secure LeetCode-style code execution system.

---

# 35. MENTOR ASSIGNMENT / TEST SHARING

Mentors can send created quizzes and coding challenges to selected students.

## Flow

```text
Mentor
   ↓
Create Quiz / Coding Challenge
   ↓
Select students
   ↓
Create assignment
   ↓
Generate secure shareable assignment link
   ↓
Send notification to selected students
   ↓
Student opens assignment
   ↓
Student accepts/starts assignment
   ↓
Student completes test
   ↓
Submit
   ↓
Results stored in database
   ↓
Mentor views results
```

## Assignment Must Store

- Assignment ID
- Mentor ID
- Assessment ID
- Student ID
- Course
- Level
- Due date
- Status
- Started timestamp
- Submitted timestamp
- Score
- Attempts
- Result

Possible statuses:

```text
SENT
OPENED
ACCEPTED
IN_PROGRESS
SUBMITTED
EXPIRED
```

## Access Control

Only intended students can open the assignment.

Do not expose assignment data to unrelated students.

The mentor must only see detailed results for students they are authorized to access.

---

# 36. ASSIGNMENT RESULTS FOR MENTORS

After a student completes an assigned test, the mentor can see:

- Student name
- Assignment
- Score
- Accuracy
- Correct answers
- Wrong answers
- Coding test cases passed
- Coding attempts
- Time taken
- Topics
- Difficulty
- Submission history
- Completion date

Use real database data.

Do not use fake results.

---

# 37. PERFORMANCE HISTORY

Maintain historical performance.

Track:

- XP
- Accuracy
- Course progress
- Topic progress
- Quiz performance
- Coding performance
- Challenge performance
- Streak
- Team performance
- Assignment performance

Display useful charts such as:

- XP over time
- Accuracy over time
- Coding accuracy
- Course progress
- Weekly comparison
- Streak history

All charts must use actual database data.

---

# 38. NOTIFICATIONS

Create a real notification system.

Notifications can include:

- Mentor request received
- Mentor request accepted
- Mentor request declined
- New assignment
- Assignment due soon
- Assignment result
- New mentor feedback
- Daily challenge
- Weekly challenge
- Team invitation
- Team competition result
- Scratch card reward
- Streak broken
- Streak restore task available
- Streak restored
- Badge earned
- Level up

Store notifications in the database.

Support:

- Read
- Unread
- Timestamp

---

# 39. PROFILE

## Student Profile

Show:

- Name
- Email
- Profile photo if implemented
- Courses
- Level
- XP
- Badges
- Streak
- Skills
- Mentor
- Team

## Mentor Profile

Show:

- Name
- Email
- Expertise
- Experience
- Availability
- About
- Students count
- Skills

---

# 40. DATABASE DESIGN

Use a real relational database.

Minimum tables/entities:

```text
users

student_profiles
mentor_profiles

courses
course_topics
lessons

questions
question_attempts

coding_problems
code_test_cases
code_submissions
code_submission_results

course_progress
topic_progress

xp_transactions
levels

streaks
streak_history
streak_restore_tasks
streak_restore_attempts

badges
student_badges

daily_challenges
weekly_challenges

teams
team_members
team_invites
team_challenges
team_submissions
team_matches
team_results

mentor_requests
mentor_student_relationships
mentor_feedback

assignments
assignment_recipients
assignment_submissions
assignment_questions

mentor_quizzes
mentor_programming_challenges

ai_conversations
ai_messages
ai_feedback
weekly_ai_analysis
performance_history

skill_coin_transactions

rewards
student_rewards

power_ups
student_power_ups
power_up_transactions

scratch_cards
scratch_card_rewards
scratch_card_results

notifications
```

Use:

- Foreign keys
- Unique constraints
- Indexes
- Timestamps
- Status enums where appropriate
- Proper cascading behavior
- Data validation

---

# 41. SECURITY

Security is mandatory.

Implement:

- Secure password hashing
- Authentication
- Protected routes
- Role-based authorization
- Server-side validation
- Input validation
- Rate limiting where appropriate
- Secure sessions/JWT
- CSRF protection when cookie authentication is used
- XSS protection
- SQL injection protection
- Secure database queries
- No secrets in frontend code
- Environment variables for API keys
- API authorization
- Server-side ownership checks

## Critical Authorization Rules

A student cannot:

- Access another student's private data
- Change another student's progress
- Change XP
- Change level
- Access another student's assignments
- Access hidden test cases

A mentor cannot:

- View detailed analytics for a student before mentor request acceptance
- Access unrelated students
- Access private student data without authorization
- Modify student results directly

A student can only access:

- Their own profile
- Their own progress
- Their own submissions
- Their own assignments
- Assignments specifically sent to them
- Their authorized team information
- Their accepted mentor relationship

---

# 42. CODE EXECUTION SECURITY

Student-submitted code is untrusted.

Never execute arbitrary code directly on the application server.

Use a sandboxed execution architecture.

Requirements:

- Isolated execution
- Timeout
- CPU limit
- Memory limit
- Restricted filesystem
- Restricted network
- Process/container isolation
- Server-side test case validation
- Hidden test cases stored securely

Never send hidden test cases to the frontend.

---

# 43. GAMIFICATION RULES

Gamification must be based on actual activities.

XP:

```text
Learning → XP
Challenges → XP
Coding → XP
Completion → XP
```

Coins:

```text
Activities → Coins
Challenges → Coins
Rewards → Coins
```

Badges:

```text
Actual achievements → Badges
```

Streak:

```text
Meaningful daily activity → Streak
```

Scratch Cards:

```text
Eligible competition win → Scratch Card
```

Do not allow users to manipulate the frontend to award themselves rewards.

All reward calculations must be validated on the backend.

---

# 44. UI/UX REQUIREMENTS

Create a modern professional educational platform.

Design style:

- Clean
- Modern
- Gamified
- Student-friendly
- Responsive
- Desktop + mobile friendly
- Clear navigation
- Accessible components
- Consistent spacing
- Consistent typography
- Meaningful empty states
- Loading states
- Error states
- Success states

Use appropriate visual elements:

- Progress bars
- Cards
- Charts
- Badges
- XP indicators
- Streak indicators
- Level indicators
- Skill coin indicators
- Coding editor
- Test-case panels
- Notifications
- Scratch-card interaction

Avoid unnecessary visual clutter.

---

# 45. STUDENT EXPERIENCE FLOW

The complete student flow should be:

```text
Register
   ↓
Choose Student
   ↓
Student Dashboard
   ↓
Course Library
   ↓
Select Python
   ↓
Level 1
   ↓
Learning Material
   ↓
Practice
   ↓
Coding Challenge
   ↓
Run Code
   ↓
Submit Code
   ↓
Test Cases Evaluated
   ↓
XP / Coins / Progress
   ↓
Level Completion
   ↓
Next Level Unlocks
   ↓
Daily Challenge
   ↓
Weekly Challenge
   ↓
Team Competition
   ↓
Rewards / Scratch Card
   ↓
AI Performance Analysis
   ↓
Weekly Comparison
```

---

# 46. MENTOR EXPERIENCE FLOW

The mentor flow should be:

```text
Register/Login
   ↓
Mentor Dashboard
   ↓
Search Students
   ↓
Select Student
   ↓
Send Mentor Request
   ↓
Wait for Student
   ↓
Student Accepts
   ↓
Student Becomes Connected
   ↓
View Student Analytics
   ↓
Provide Feedback
   ↓
Create Quiz
   OR
Create Coding Challenge
   ↓
Select Connected Students
   ↓
Send Assignment
   ↓
Student Receives Notification
   ↓
Student Opens Assignment
   ↓
Student Completes Test
   ↓
Results Stored
   ↓
Mentor Views Results
```

---

# 47. AI PERFORMANCE FLOW

The AI performance flow should be:

```text
Student performs activities
        ↓
Database stores performance
        ↓
Weekly metrics generated
        ↓
Week 1 AI baseline
        ↓
Week 2 metrics
        ↓
Week 2 vs Week 1 comparison
        ↓
Week 3 metrics
        ↓
Week 3 vs Week 2 comparison
        ↓
Continue every week
        ↓
Display in ONE AI Performance menu
```

The AI must never invent performance numbers.

---

# 48. TEAM COMPETITION FLOW

```text
Students
   ↓
Create / Join Team
   ↓
Maximum 5 Members
   ↓
Comparable Skill / Level
   ↓
Team Challenge
   ↓
Compete Against Other Teams
   ↓
Calculate Team Score
   ↓
Determine Result
   ↓
Winning Team
   ↓
Scratch Card Token
   ↓
Scratch
   ↓
Hint / Restore / Skip Reward
   ↓
Store Reward
```

---

# 49. ERROR HANDLING

Every important operation must have:

- Loading state
- Success state
- Error state
- Empty state

Examples:

```text
Login failed
Invalid password
Email already exists
Mentor request failed
Assignment expired
Code compilation failed
Runtime error
Time limit exceeded
No test cases passed
No teams available
No AI data available yet
Insufficient data for weekly comparison
```

Errors should be understandable to beginners.

Do not expose sensitive backend information.

---

# 50. API REQUIREMENTS

Create clean APIs for:

### Authentication

```text
/register
/login
/logout
/me
```

### Student

```text
/student/dashboard
/student/profile
/student/courses
/student/progress
/student/challenges
/student/rewards
```

### Mentor

```text
/mentor/dashboard
/mentor/students
/mentor/requests
/mentor/feedback
/mentor/assignments
```

### Mentor Requests

```text
/mentor-requests
/mentor-requests/:id/accept
/mentor-requests/:id/decline
```

Only the student receiving the request can accept/decline it.

### Assignments

```text
/assignments
/assignments/:id
/assignments/:id/start
/assignments/:id/submit
```

### Coding

```text
/coding/problems
/coding/problems/:id/run
/coding/problems/:id/submit
/coding/submissions
```

### Teams

```text
/teams
/teams/create
/teams/join
/teams/invite
/teams/challenges
/teams/matches
```

### AI

```text
/ai/chat
/ai/performance
/ai/performance/weekly
/ai/streak-restore
```

Use appropriate HTTP methods and authorization.

---

# 51. BACKEND BUSINESS RULES

Business rules must be enforced on the backend.

Examples:

## Team Limit

```text
if team_members >= 5:
    reject new member
```

## Mentor Analytics

```text
if relationship.status != ACCEPTED:
    deny detailed student analytics
```

## Scratch Card

```text
if competition_result != WIN:
    do not award winning scratch card
```

## Restore Card

```text
if student does not own Restore Card:
    reject usage
```

## Skip Card

```text
if student does not own Skip Card:
    reject usage
```

## XP

Never accept:

```text
POST /xp
{
  "xp": 100000
}
```

from the client as a trusted value.

The backend must calculate valid XP.

---

# 52. DATA CONSISTENCY

Use transactions where required.

For example, completing a challenge may update:

```text
Challenge Result
XP Transaction
Skill Coin Transaction
Progress
Badge
Streak
Notification
```

These updates should remain consistent.

Avoid situations where:

- XP is awarded but challenge is not completed
- Badge is awarded twice
- Coins are deducted without reward
- Team result is stored without competition
- Assignment score exists without submission

---

# 53. TESTING REQUIREMENTS

Test:

## Authentication

- Register
- Login
- Logout
- Wrong password
- Duplicate email

## Roles

- Student cannot access mentor routes
- Mentor cannot access student-only private routes

## Mentor Requests

- Mentor sends request
- Student receives request
- Student accepts
- Student declines
- Analytics locked before acceptance
- Analytics unlocked after acceptance

## Coding

- Run public tests
- Submit hidden tests
- Compilation error
- Runtime error
- Time limit
- Wrong answer
- Correct answer

## Teams

- Create team
- Maximum 5 members
- Team invite
- Competition
- Winner
- Scratch card

## Streak

- Daily activity
- Missed day
- Streak broken
- AI restore task
- Successful restoration
- Restore card

## AI

- Week 1 baseline
- Week 2 comparison
- Week 3 comparison
- Insufficient data handling

## Assignments

- Mentor creates
- Student receives
- Student accepts/starts
- Student submits
- Mentor sees result

---

# 54. NO FAKE DATA POLICY

This application must never pretend that fake information is real.

Do not use:

```text
fake users
fake progress
fake XP
fake analytics
fake quiz scores
fake coding submissions
fake mentor relationships
fake AI analysis
fake team results
fake rewards
```

If there is no data, show a meaningful empty state.

Example:

```text
No performance data yet.

Complete your first challenge to generate AI insights.
```

---

# 55. DATABASE SEEDING

It is acceptable to seed educational content such as:

- Courses
- Topics
- Lessons
- Example questions
- Coding problems
- Test cases
- Badge definitions
- Reward definitions
- XP rules

But do NOT seed fake student progress.

Do NOT create fake logged-in users.

Educational content can be preloaded; user performance must be generated from actual activity.

---

# 56. RESPONSIVE DESIGN

The application must work on:

- Desktop
- Laptop
- Tablet
- Mobile

Important screens:

- Authentication
- Student Dashboard
- Course Page
- Learning Page
- Coding Editor
- Challenges
- Team Page
- Rewards
- Mentor Requests
- Mentor Dashboard
- Assignment Page
- AI Performance
- Profile

---

# 57. IMPLEMENTATION PRIORITY

Build in this order:

## Phase 1

Authentication:

- Login
- Signup
- Role selection
- Logout
- Protected routes

## Phase 2

Database:

- Users
- Student profiles
- Mentor profiles
- Courses
- Topics
- Progress

## Phase 3

Student Learning:

- Course library
- Levels
- Learning content
- Practice
- Progress

## Phase 4

Coding Platform:

- Coding problems
- Editor
- Run
- Submit
- Public tests
- Hidden tests
- Secure execution
- Submission history

## Phase 5

Gamification:

- XP
- Levels
- Coins
- Badges
- Streak

## Phase 6

Mentor System:

- Mentor search
- Mentor request
- Student accept/decline
- Active relationship
- Analytics
- Feedback

## Phase 7

Mentor Assessments:

- Quiz creation
- Coding challenge creation
- Assignment links
- Notifications
- Student submission
- Results

## Phase 8

Teams:

- Team creation
- Maximum 5
- Team challenges
- Competition
- Winner
- Scratch cards

## Phase 9

AI:

- Learning Assistant
- AI Performance
- Weekly comparison
- AI streak restore

## Phase 10

Polish:

- Notifications
- Charts
- Responsive UI
- Error states
- Loading states
- Security
- Testing

---

# 58. FINAL ACCEPTANCE CRITERIA

The project is considered complete only when the following work end-to-end.

## Authentication

- Student can register
- Mentor can register
- Student can login
- Mentor can login
- Logout works
- Protected routes work

## Student

- New student starts at zero
- Student can learn courses
- Levels unlock correctly
- Practice works
- Coding challenges work
- Test cases work
- XP works
- Coins work
- Badges work
- Streak works
- AI performance works
- Weekly comparisons work

## Mentor

- Mentor can search students
- Mentor can send requests
- Student can accept/decline
- Mentor analytics are hidden before acceptance
- Mentor analytics become available after acceptance
- Mentor can provide feedback
- Mentor can create quizzes
- Mentor can create coding challenges
- Mentor can send assignments
- Mentor can view results

## Coding Platform

- Code editor works
- Run works
- Submit works
- Public tests work
- Hidden tests work
- Results are stored
- Secure execution is implemented

## Teams

- Maximum 5 members
- Skill-based team formation
- Team competitions work
- Results are stored
- Winning team receives scratch-card opportunity

## Scratch Cards

- Scratch card exists
- Backend determines reward
- Hint Card works
- Restore Card works
- Skip Card works
- Rewards are stored

## Streak Restore

- Missed day breaks streak
- AI generates restore task
- Student can attempt task
- Passing restores streak according to rules
- Restore attempts are stored

## AI

- One dedicated AI Performance menu
- Week 1 baseline
- Week 2 vs Week 1
- Week 3 vs Week 2
- Continues for every week
- Works across all levels
- Uses actual data
- Does not fabricate metrics

---

# 59. IMPORTANT DEVELOPMENT RULE

Before changing code:

1. Inspect the existing project.
2. Identify frontend framework.
3. Identify backend framework.
4. Identify database.
5. Identify authentication implementation.
6. Identify existing routes.
7. Identify existing components/pages.
8. Identify existing API structure.
9. Identify current project folder structure.
10. Reuse existing architecture where practical.

Then implement the requirements above incrementally.

Do not destroy working functionality unnecessarily.

If an existing feature conflicts with this specification, update it to match this specification.

Prioritize working functionality over decorative UI.

The final result must be a real full-stack gamified learning platform suitable for a hackathon demonstration.
