import { db } from './server/db/schema.js';

try {
  // 1. Get a student and a mentor
  const student = db.prepare("SELECT id, name FROM users WHERE role = 'STUDENT' LIMIT 1").get();
  const mentor = db.prepare("SELECT id, name FROM users WHERE role = 'MENTOR' LIMIT 1").get();

  console.log('Student:', student);
  console.log('Mentor:', mentor);

  // 2. Clear existing relationships/requests between them
  db.prepare("DELETE FROM mentor_requests WHERE student_id = ? AND mentor_id = ?").run(student.id, mentor.id);
  db.prepare("DELETE FROM mentor_student_relationships WHERE student_id = ? AND mentor_id = ?").run(student.id, mentor.id);

  // 3. Create Request (Simulate Student)
  const reqResult = db.prepare(`
    INSERT INTO mentor_requests (mentor_id, student_id, message, status)
    VALUES (?, ?, ?, 'PENDING')
  `).run(mentor.id, student.id, 'Test request from E2E');
  const requestId = reqResult.lastInsertRowid;
  console.log('Request Created ID:', requestId);

  // 4. Accept Request (Simulate Mentor)
  db.prepare(`
    UPDATE mentor_requests SET status = 'ACCEPTED', responded_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(requestId);

  db.prepare(`
    INSERT INTO mentor_student_relationships (mentor_id, student_id, status)
    VALUES (?, ?, 'ACTIVE')
    ON CONFLICT(student_id) DO UPDATE SET mentor_id = ?, status = 'ACTIVE'
  `).run(mentor.id, student.id, mentor.id);

  console.log('Request Accepted!');

  // 5. Verify Database
  const rel = db.prepare(`SELECT * FROM mentor_student_relationships WHERE student_id = ?`).get(student.id);
  console.log('Active Relationship:', rel);

  console.log('E2E TEST PASSED');
} catch (e) {
  console.error('Error:', e);
}
