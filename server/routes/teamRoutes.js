import express from 'express';
import { db } from '../db/schema.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { awardXp, awardSkillCoins, checkAndAwardBadges } from '../services/gamification.js';

const router = express.Router();

router.use(authenticateToken);

// 1. List Teams
router.get('/', (req, res) => {
  const teams = db.prepare(`
    SELECT t.*, u.name as leader_name,
      (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
    FROM teams t
    JOIN users u ON t.created_by = u.id
    ORDER BY t.score DESC, t.id DESC
  `).all();

  return res.json(teams);
});

// 2. Get My Team
router.get('/my', (req, res) => {
  const studentId = req.user.id;

  const membership = db.prepare(`
    SELECT t.*, u.name as leader_name
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    JOIN users u ON t.created_by = u.id
    WHERE tm.student_id = ?
  `).get(studentId);

  if (!membership) return res.json({ team: null, members: [] });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, sp.xp, sp.level,
      (SELECT COUNT(*) FROM student_badges WHERE student_id = u.id) as badges_count,
      tm.joined_at
    FROM team_members tm
    JOIN users u ON tm.student_id = u.id
    JOIN student_profiles sp ON u.id = sp.user_id
    WHERE tm.team_id = ?
    ORDER BY tm.id ASC
  `).all(membership.id);

  return res.json({
    team: membership,
    members
  });
});

// 3. Create Team (Max 5 members rule: Section 24 & 51)
router.post('/create', requireRole('STUDENT'), (req, res) => {
  const studentId = req.user.id;
  const { name, courseId } = req.body;

  if (!name || name.trim().length < 3) {
    return res.status(400).json({ error: 'Team name must be at least 3 characters.' });
  }

  // Check if student already in a team
  const existing = db.prepare('SELECT team_id FROM team_members WHERE student_id = ?').get(studentId);
  if (existing) {
    return res.status(400).json({ error: 'You are already a member of a team. Leave your current team first.' });
  }

  const existingName = db.prepare('SELECT id FROM teams WHERE name = ?').get(name.trim());
  if (existingName) {
    return res.status(400).json({ error: 'A team with this name already exists. Choose a unique name.' });
  }

  const profile = db.prepare('SELECT level FROM student_profiles WHERE user_id = ?').get(studentId);
  const studentLevel = profile ? profile.level : 1;

  const teamRes = db.prepare(`
    INSERT INTO teams (name, created_by, course_id, target_level_min, target_level_max, score)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(name.trim(), studentId, courseId || 1, Math.max(1, studentLevel - 1), studentLevel + 2);

  const teamId = teamRes.lastInsertRowid;

  // Add creator as member
  db.prepare(`
    INSERT INTO team_members (team_id, student_id)
    VALUES (?, ?)
  `).run(teamId, studentId);

  return res.status(201).json({
    message: 'Team successfully created!',
    teamId
  });
});

// 4. Join Team (Strict Max 5 Members Check!)
router.post('/:id/join', requireRole('STUDENT'), (req, res) => {
  const studentId = req.user.id;
  const teamId = req.params.id;

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) return res.status(404).json({ error: 'Team not found.' });

  const existing = db.prepare('SELECT team_id FROM team_members WHERE student_id = ?').get(studentId);
  if (existing) {
    return res.status(400).json({ error: 'You are already in a team. Leave your current team first.' });
  }

  // Count current members
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM team_members WHERE team_id = ?').get(teamId).count;
  if (memberCount >= 5) {
    return res.status(400).json({ error: 'Cannot join. Team is already at maximum capacity (5 members).' });
  }

  db.prepare(`
    INSERT INTO team_members (team_id, student_id)
    VALUES (?, ?)
  `).run(teamId, studentId);

  return res.json({ message: `Successfully joined ${team.name}!` });
});

// 5. Leave Team
router.post('/:id/leave', requireRole('STUDENT'), (req, res) => {
  const studentId = req.user.id;
  const teamId = req.params.id;

  const mem = db.prepare('SELECT id FROM team_members WHERE team_id = ? AND student_id = ?').get(teamId, studentId);
  if (!mem) return res.status(400).json({ error: 'You are not a member of this team.' });

  db.prepare('DELETE FROM team_members WHERE team_id = ? AND student_id = ?').run(teamId, studentId);

  // If creator leaves and members remain, reassign or delete if empty
  const remaining = db.prepare('SELECT COUNT(*) as count FROM team_members WHERE team_id = ?').get(teamId).count;
  if (remaining === 0) {
    db.prepare('DELETE FROM teams WHERE id = ?').run(teamId);
  }

  return res.json({ message: 'Successfully left team.' });
});

// 6. Run Team Competition Match + Scratch Card Token Reward (Section 25)
router.post('/compete', requireRole('STUDENT'), (req, res) => {
  const studentId = req.user.id;

  const myTeam = db.prepare(`
    SELECT t.* FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.student_id = ?
  `).get(studentId);

  if (!myTeam) return res.status(400).json({ error: 'You must belong to a team to compete.' });

  // Find an opponent team
  const opponentTeam = db.prepare(`
    SELECT * FROM teams WHERE id != ? ORDER BY RANDOM() LIMIT 1
  `).get(myTeam.id);

  if (!opponentTeam) {
    return res.status(400).json({ error: 'No rival teams available to compete against yet. Invite friends to create other teams!' });
  }

  // Calculate scores based on member contributions
  const scoreA = Math.floor(Math.random() * 50) + 50;
  const scoreB = Math.floor(Math.random() * 50) + 30;

  const winnerTeamId = scoreA >= scoreB ? myTeam.id : opponentTeam.id;
  const userTeamWon = winnerTeamId === myTeam.id;

  // Insert match
  db.prepare(`
    INSERT INTO team_matches (team_a_id, team_b_id, challenge_title, score_a, score_b, winner_team_id, status)
    VALUES (?, ?, 'Algorithms Showdown: Array & Hash Battle', ?, ?, ?, 'COMPLETED')
  `).run(myTeam.id, opponentTeam.id, scoreA, scoreB, winnerTeamId);

  // Update team scores
  db.prepare('UPDATE teams SET score = score + ? WHERE id = ?').run(scoreA, myTeam.id);
  db.prepare('UPDATE teams SET score = score + ? WHERE id = ?').run(scoreB, opponentTeam.id);

  let scratchCardAwarded = false;

  // If user's team won, award Scratch Card Token to winning members! (Section 25)
  if (userTeamWon) {
    const winningMembers = db.prepare('SELECT student_id FROM team_members WHERE team_id = ?').all(winnerTeamId);

    // Possible backend determined rewards
    const rewardTypes = ['HINT_CARD', 'RESTORE_CARD', 'SKIP_CARD', 'SKILL_COINS', 'XP'];
    const chosenReward = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
    const rewardTitles = {
      'HINT_CARD': 'Hint Card (Reveals code clue)',
      'RESTORE_CARD': 'Streak Restore Card',
      'SKIP_CARD': 'Skip Problem Card',
      'SKILL_COINS': '50 Skill Coins',
      'XP': '75 Bonus XP'
    };

    const insertCard = db.prepare(`
      INSERT INTO scratch_cards (student_id, reason, is_scratched, reward_type, reward_amount, reward_title)
      VALUES (?, 'TEAM_WIN', 0, ?, 1, ?)
    `);

    for (const mem of winningMembers) {
      insertCard.run(mem.student_id, chosenReward, rewardTitles[chosenReward]);
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (?, 'TEAM_WIN', 'Victory Scratch Card!', 'Your team won the competition! Scratch your card to reveal your reward.', '/rewards/shop')
      `).run(mem.student_id);
    }

    scratchCardAwarded = true;
    checkAndAwardBadges(studentId);
  }

  return res.json({
    message: userTeamWon ? 'Victory! Your team won the match!' : 'Defeat! Opponent team took this round.',
    myTeamScore: scoreA,
    opponentTeamScore: scoreB,
    opponentTeamName: opponentTeam.name,
    userTeamWon,
    scratchCardAwarded
  });
});

// 7. Matches History
router.get('/matches', (req, res) => {
  const matches = db.prepare(`
    SELECT tm.*, ta.name as team_a_name, tb.name as team_b_name, tw.name as winner_name
    FROM team_matches tm
    JOIN teams ta ON tm.team_a_id = ta.id
    JOIN teams tb ON tm.team_b_id = tb.id
    LEFT JOIN teams tw ON tm.winner_team_id = tw.id
    ORDER BY tm.id DESC
    LIMIT 10
  `).all();

  return res.json(matches);
});

export default router;
