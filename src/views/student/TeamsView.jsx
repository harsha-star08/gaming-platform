import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Users,
  Shield,
  Swords,
  Trophy,
  Gift,
  Plus,
  LogOut,
  UserCheck,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../../api';
import ScratchCardModal from '../../components/ScratchCardModal';

export default function TeamsView({ onRefreshStats }) {
  const [myTeamData, setMyTeamData] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [createError, setCreateError] = useState(null);

  // Battle execution
  const [isBattling, setIsBattling] = useState(false);
  const [battleResult, setBattleResult] = useState(null);

  // Scratch card modal trigger
  const [scratchCardToOpen, setScratchCardToOpen] = useState(null);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    setIsLoading(true);
    try {
      const [myRes, allRes, matchesRes] = await Promise.all([
        api.teams.getMyTeam(),
        api.teams.getTeams(),
        api.teams.getMatches()
      ]);
      setMyTeamData(myRes);
      setAllTeams(allRes);
      setMatches(matchesRes);
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await api.teams.createTeam(newTeamName);
      setShowCreateModal(false);
      setNewTeamName('');
      loadTeamData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      setCreateError(err.message);
    }
  };

  const handleJoinTeam = async (teamId) => {
    try {
      await api.teams.joinTeam(teamId);
      loadTeamData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLeaveTeam = async () => {
    if (!myTeamData?.team) return;
    if (!confirm('Are you sure you want to leave this team?')) return;
    try {
      await api.teams.leaveTeam(myTeamData.team.id);
      loadTeamData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompete = async () => {
    setIsBattling(true);
    setBattleResult(null);
    try {
      const res = await api.teams.compete();
      setBattleResult(res);

      if (res.userTeamWon) {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        // Fetch the awarded scratch card and open the scratch card modal!
        const cards = await api.rewards.getScratchCards();
        if (cards && cards.length > 0) {
          const unscratched = cards.find(c => !c.is_scratched);
          if (unscratched) {
            setScratchCardToOpen(unscratched);
          }
        }
      }
      loadTeamData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsBattling(false);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>Loading team squad data...</div>;
  }

  const hasTeam = !!myTeamData?.team;
  const myTeam = myTeamData?.team;
  const members = myTeamData?.members || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1050, margin: '0 auto' }}>
      {/* Scratch Card Reveal Modal */}
      {scratchCardToOpen && (
        <ScratchCardModal
          card={scratchCardToOpen}
          onClose={() => setScratchCardToOpen(null)}
          onRevealed={() => {
            loadTeamData();
            if (onRefreshStats) onRefreshStats();
          }}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Team Squads & Battle Arena</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Collaborate in squads of up to 5 members. Win competitions to earn interactive Scratch Cards!
          </p>
        </div>

        {!hasTeam && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>Create Squad</span>
          </button>
        )}
      </div>

      {/* My Team Section */}
      {hasTeam ? (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(22, 29, 44, 0.8) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          padding: '28px 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                Your Squad (Max 5 Members)
              </span>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginTop: 2 }}>{myTeam.name}</h2>
              <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>
                Leader: {myTeam.leader_name} | Squad Total Score: <strong>{myTeam.score} pts</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={handleCompete}
                disabled={isBattling}
              >
                <Swords size={16} />
                <span>{isBattling ? 'Battling...' : 'Enter Competition Arena'}</span>
              </button>

              <button className="btn btn-secondary btn-sm" onClick={handleLeaveTeam} title="Leave Squad">
                <LogOut size={15} />
                <span>Leave</span>
              </button>
            </div>
          </div>

          {/* Battle Result Announcement */}
          {battleResult && (
            <div style={{
              padding: '14px 18px', borderRadius: 8, marginBottom: 20,
              background: battleResult.userTeamWon ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: battleResult.userTeamWon ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-rose)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <span style={{
                  fontSize: 16, fontWeight: 800,
                  color: battleResult.userTeamWon ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                }}>
                  {battleResult.message}
                </span>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Your Squad: {battleResult.myTeamScore} pts vs {battleResult.opponentTeamName}: {battleResult.opponentTeamScore} pts
                </div>
              </div>

              {battleResult.scratchCardAwarded && (
                <button className="btn btn-success btn-sm" onClick={() => {
                  api.rewards.getScratchCards().then(cards => {
                    const unscratched = cards.find(c => !c.is_scratched);
                    if (unscratched) setScratchCardToOpen(unscratched);
                  });
                }}>
                  <Gift size={14} />
                  <span>Scratch Prize Card</span>
                </button>
              )}
            </div>
          )}

          {/* Members Grid (Strictly 5 Slots visualized: Section 24) */}
          <h4 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
            Squad Roster ({members.length}/5 Active Members)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[0, 1, 2, 3, 4].map((slotIdx) => {
              const mem = members[slotIdx];
              return (
                <div key={slotIdx} style={{
                  padding: '16px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: mem ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.25)',
                  border: mem ? '1px solid var(--border-subtle)' : '1px dashed rgba(255, 255, 255, 0.1)',
                  textAlign: 'center',
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {mem ? (
                    <>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: '#fff', marginBottom: 8
                      }}>
                        {mem.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {mem.name}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--accent-cyan)' }}>Level {mem.level}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Open Slot {slotIdx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Not In A Team */
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Users size={48} color="var(--primary)" style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>You haven't joined a squad yet</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 500, margin: '0 auto 20px' }}>
            Team up with up to 4 other students in your level range. Win algorithmic competitions together to earn scratch cards and bonus XP!
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>Create a New Squad</span>
          </button>
        </div>
      )}

      {/* Available Teams to Join */}
      <div className="card">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Available Squads in UpSkill</h3>
        {allTeams.length === 0 ? (
          <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>No squads created yet. Be the first to start one!</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {allTeams.map((t) => {
              const isFull = t.member_count >= 5;
              const isMyTeam = myTeam?.id === t.id;

              return (
                <div key={t.id} style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: isMyTeam ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h4 style={{ fontSize: 16, color: '#fff' }}>{t.name}</h4>
                    <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                      Leader: {t.leader_name} | {t.score} pts
                    </span>
                    <div style={{ fontSize: 11, color: isFull ? 'var(--accent-rose)' : 'var(--accent-emerald)', marginTop: 4 }}>
                      {t.member_count}/5 Members {isFull ? '(FULL)' : ''}
                    </div>
                  </div>

                  {!hasTeam && !isFull && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleJoinTeam(t.id)}>
                      Join
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ padding: 28 }}>
            <h3 style={{ fontSize: 20, marginBottom: 12 }}>Create a Squad</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Squads have a strict limit of 5 members. You will be assigned as the team leader.
            </p>

            {createError && (
              <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(244,63,94,0.15)', color: '#fda4af', fontSize: 13, marginBottom: 14 }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label className="form-label">Squad Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ByteMasters"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
