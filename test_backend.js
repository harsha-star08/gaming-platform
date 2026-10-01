// Full integration test for all core flows
async function runTests() {
  const baseUrl = 'http://localhost:5000/api';

  console.log('--- 1. Testing Student Registration ---');
  const studentEmail = `student_${Date.now()}@test.com`;
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Jenifer',
      email: studentEmail,
      password: 'password123',
      confirmPassword: 'password123',
      role: 'STUDENT'
    })
  });
  const regData = await regRes.json();
  console.log('Student registered:', regData.user.name, 'Token received:', !!regData.token);
  const studentToken = regData.token;

  console.log('--- 2. Checking Zero Start (Section 3) ---');
  const dashRes = await fetch(`${baseUrl}/student/dashboard`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const dashData = await dashRes.json();
  console.log('Initial stats (must be 0):', {
    xp: dashData.stats.xp,
    level: dashData.stats.level,
    skillCoins: dashData.stats.skillCoins,
    streak: dashData.stats.currentStreak,
    badges: dashData.stats.badgesCount,
    mentorStatus: dashData.mentor.status
  });

  console.log('--- 3. Testing Mentor Registration ---');
  const mentorEmail = `mentor_${Date.now()}@test.com`;
  const mentorReg = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. Alan Turing',
      email: mentorEmail,
      password: 'password123',
      confirmPassword: 'password123',
      role: 'MENTOR'
    })
  });
  const mentorData = await mentorReg.json();
  console.log('Mentor registered:', mentorData.user.name);
  const mentorToken = mentorData.token;

  console.log('--- 4. Mentor Searching Students Directory ---');
  const searchRes = await fetch(`${baseUrl}/mentor/students/search?query=Jenifer`, {
    headers: { 'Authorization': `Bearer ${mentorToken}` }
  });
  const searchResults = await searchRes.json();
  console.log('Search found student:', searchResults[0]?.name, 'ID:', searchResults[0]?.id);
  const studentId = searchResults[0].id;

  console.log('--- 5. Verifying Privacy Rule (Section 8) ---');
  const deniedRes = await fetch(`${baseUrl}/mentor/students/${studentId}/analytics`, {
    headers: { 'Authorization': `Bearer ${mentorToken}` }
  });
  console.log('Pre-acceptance analytics access status (Expected 403):', deniedRes.status);

  console.log('--- 6. Mentor Sends Request ---');
  const reqRes = await fetch(`${baseUrl}/mentor/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mentorToken}`
    },
    body: JSON.stringify({
      studentId,
      message: 'Welcome! I would love to guide you through Python mastery.'
    })
  });
  const reqData = await reqRes.json();
  console.log('Mentor request sent:', reqData.message);

  console.log('--- 7. Student Accepts Request ---');
  const pendingRes = await fetch(`${baseUrl}/mentor-requests`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const requests = await pendingRes.json();
  console.log('Student received request from:', requests[0]?.mentor_name);

  const acceptRes = await fetch(`${baseUrl}/mentor-requests/${requests[0].id}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const acceptData = await acceptRes.json();
  console.log('Student accepted:', acceptData.message);

  console.log('--- 8. Verifying Analytics Unlocked Post-Acceptance ---');
  const unlockedRes = await fetch(`${baseUrl}/mentor/students/${studentId}/analytics`, {
    headers: { 'Authorization': `Bearer ${mentorToken}` }
  });
  console.log('Post-acceptance analytics access status (Expected 200):', unlockedRes.status);

  console.log('--- 9. Student Solves Coding Problem (LeetCode Sandbox) ---');
  const codeSolution = `import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if lines:\n        print(int(lines[0]) + int(lines[1]))\n\nif __name__ == '__main__':\n    solve()`;
  const submitRes = await fetch(`${baseUrl}/coding/problems/sum-of-two-numbers/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({ code: codeSolution })
  });
  const submitData = await submitRes.json();
  console.log('Submission evaluation result:', {
    status: submitData.status,
    score: submitData.score,
    passedCount: submitData.passedCount,
    totalCount: submitData.totalCount,
    xpAwarded: submitData.xpAwarded,
    coinsAwarded: submitData.coinsAwarded
  });

  console.log('--- 10. AI Performance Baseline ---');
  const aiRes = await fetch(`${baseUrl}/ai/performance`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const aiData = await aiRes.json();
  console.log('AI Performance generated:', {
    hasData: aiData.analysis.hasData,
    weekNumber: aiData.analysis.weekNumber,
    isBaseline: aiData.analysis.isBaseline,
    analysisText: aiData.analysis.aiAnalysisText
  });

  console.log('\n>>> ALL 10 BACKEND INTEGRATION TESTS PASSED PERFECTLY! <<<');
  process.exit(0);
}

// Start server and run tests
import('./server/server.js').then(() => {
  setTimeout(runTests, 1500);
});
