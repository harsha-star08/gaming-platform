import express from 'express';
import { db } from '../db/schema.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { spendSkillCoins, awardXp, awardSkillCoins } from '../services/gamification.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('STUDENT'));

// 1. Reward Shop Items
router.get('/shop', (req, res) => {
  const items = db.prepare('SELECT * FROM power_ups ORDER BY price_coins ASC').all();
  const profile = db.prepare('SELECT skill_coins, xp FROM student_profiles WHERE user_id = ?').get(req.user.id);

  return res.json({
    items,
    coins: profile ? profile.skill_coins : 0,
    xp: profile ? profile.xp : 0
  });
});

// 2. Buy Power-Up
router.post('/buy', (req, res) => {
  const studentId = req.user.id;
  const { powerUpId } = req.body;

  if (!powerUpId) return res.status(400).json({ error: 'powerUpId is required.' });

  const item = db.prepare('SELECT * FROM power_ups WHERE id = ?').get(powerUpId);
  if (!item) return res.status(404).json({ error: 'Shop item not found.' });

  try {
    const coinRes = spendSkillCoins(studentId, item.price_coins, `Purchased ${item.name} from Reward Shop`);

    // Add to student inventory
    db.prepare(`
      INSERT INTO student_power_ups (student_id, power_up_id, quantity)
      VALUES (?, ?, 1)
      ON CONFLICT(student_id, power_up_id) DO UPDATE SET quantity = quantity + 1
    `).run(studentId, powerUpId);

    return res.json({
      message: `Successfully purchased ${item.name}!`,
      remainingCoins: coinRes.newCoins,
      item
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// 3. Power-Up Inventory
router.get('/inventory', (req, res) => {
  const studentId = req.user.id;

  const inventory = db.prepare(`
    SELECT p.*, COALESCE(spu.quantity, 0) as quantity
    FROM power_ups p
    LEFT JOIN student_power_ups spu ON p.id = spu.power_up_id AND spu.student_id = ?
    ORDER BY p.id ASC
  `).all(studentId);

  return res.json(inventory);
});

// 4. Scratch Cards
router.get('/scratch-cards', (req, res) => {
  const cards = db.prepare(`
    SELECT * FROM scratch_cards
    WHERE student_id = ?
    ORDER BY id DESC
  `).all(req.user.id);

  return res.json(cards);
});

// 5. Reveal / Scratch Card (Backend securely predetermines and awards: Section 25)
router.post('/scratch-cards/:id/reveal', (req, res) => {
  const studentId = req.user.id;
  const cardId = req.params.id;

  const card = db.prepare('SELECT * FROM scratch_cards WHERE id = ? AND student_id = ?').get(cardId, studentId);
  if (!card) return res.status(404).json({ error: 'Scratch card not found.' });

  if (card.is_scratched) {
    return res.json({
      message: 'Card was already scratched.',
      alreadyScratched: true,
      card
    });
  }

  // Mark scratched
  db.prepare(`
    UPDATE scratch_cards
    SET is_scratched = 1, scratched_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(cardId);

  // Credit inventory or balance based on reward_type
  if (card.reward_type === 'HINT_CARD') {
    const pu = db.prepare("SELECT id FROM power_ups WHERE item_key = 'hint_card'").get();
    if (pu) {
      db.prepare(`
        INSERT INTO student_power_ups (student_id, power_up_id, quantity)
        VALUES (?, ?, 1)
        ON CONFLICT(student_id, power_up_id) DO UPDATE SET quantity = quantity + 1
      `).run(studentId, pu.id);
    }
  } else if (card.reward_type === 'RESTORE_CARD') {
    const pu = db.prepare("SELECT id FROM power_ups WHERE item_key = 'restore_card'").get();
    if (pu) {
      db.prepare(`
        INSERT INTO student_power_ups (student_id, power_up_id, quantity)
        VALUES (?, ?, 1)
        ON CONFLICT(student_id, power_up_id) DO UPDATE SET quantity = quantity + 1
      `).run(studentId, pu.id);
    }
  } else if (card.reward_type === 'SKIP_CARD') {
    const pu = db.prepare("SELECT id FROM power_ups WHERE item_key = 'skip_card'").get();
    if (pu) {
      db.prepare(`
        INSERT INTO student_power_ups (student_id, power_up_id, quantity)
        VALUES (?, ?, 1)
        ON CONFLICT(student_id, power_up_id) DO UPDATE SET quantity = quantity + 1
      `).run(studentId, pu.id);
    }
  } else if (card.reward_type === 'SKILL_COINS') {
    awardSkillCoins(studentId, 50, 'Scratch Card Reward');
  } else if (card.reward_type === 'XP') {
    awardXp(studentId, 75, 'Scratch Card Reward', 'SCRATCH_CARD');
  }

  return res.json({
    message: 'Reward unlocked!',
    rewardType: card.reward_type,
    rewardTitle: card.reward_title,
    rewardAmount: card.reward_amount
  });
});

// 6. Transactions Audit History (Section 18 & 26)
router.get('/transactions', (req, res) => {
  const studentId = req.user.id;

  const xpLogs = db.prepare(`
    SELECT * FROM xp_transactions
    WHERE student_id = ?
    ORDER BY id DESC
    LIMIT 25
  `).all(studentId);

  const coinLogs = db.prepare(`
    SELECT * FROM skill_coin_transactions
    WHERE student_id = ?
    ORDER BY id DESC
    LIMIT 25
  `).all(studentId);

  return res.json({
    xpTransactions: xpLogs,
    coinTransactions: coinLogs
  });
});

export default router;
