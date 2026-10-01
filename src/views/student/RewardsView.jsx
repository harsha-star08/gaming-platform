import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Coins,
  ShoppingBag,
  Sparkles,
  Gift,
  Lightbulb,
  Heart,
  FastForward,
  Zap,
  CheckCircle,
  History,
  Lock
} from 'lucide-react';
import { api } from '../../api';
import ScratchCardModal from '../../components/ScratchCardModal';

export default function RewardsView({ onRefreshStats }) {
  const [shopData, setShopData] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [scratchCards, setScratchCards] = useState([]);
  const [transactions, setTransactions] = useState({ xpTransactions: [], coinTransactions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);
  const [cardToScratch, setCardToScratch] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [shop, inv, cards, tx] = await Promise.all([
        api.rewards.getShop(),
        api.rewards.getInventory(),
        api.rewards.getScratchCards(),
        api.rewards.getTransactions()
      ]);
      setShopData(shop);
      setInventory(inv);
      setScratchCards(cards);
      setTransactions(tx);
    } catch (err) {
      console.error('Failed to load rewards data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async (powerUpId) => {
    setBuyingId(powerUpId);
    try {
      await api.rewards.buyPowerUp(powerUpId);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      loadData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setBuyingId(null);
    }
  };

  const getItemIcon = (key) => {
    switch (key) {
      case 'hint_card': return <Lightbulb size={24} color="#f59e0b" />;
      case 'restore_card': return <Heart size={24} color="#f43f5e" />;
      case 'skip_card': return <FastForward size={24} color="#06b6d4" />;
      case 'double_xp': return <Zap size={24} color="#8b5cf6" />;
      default: return <Sparkles size={24} color="#6366f1" />;
    }
  };

  if (isLoading || !shopData) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-faint)' }}>Loading Reward Shop...</div>;
  }

  const unscratchedCards = scratchCards.filter(c => !c.is_scratched);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1050, margin: '0 auto' }}>
      {/* Scratch Modal */}
      {cardToScratch && (
        <ScratchCardModal
          card={cardToScratch}
          onClose={() => setCardToScratch(null)}
          onRevealed={() => {
            loadData();
            if (onRefreshStats) onRefreshStats();
          }}
        />
      )}

      {/* Hero Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        padding: '28px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#eab308', textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Skill Coins & Shop
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 4, marginBottom: 6 }}>UpSkill Power-Up Vault</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Earn Skill Coins through lessons, challenges, and team victories. Exchange them for powerful learning aids.
          </p>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(234, 179, 8, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308'
          }}>
            <Coins size={24} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase' }}>Your Balance</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#eab308' }}>{shopData.coins} Coins</div>
          </div>
        </div>
      </div>

      {/* Unscratched Cards Alert Banner (Section 25) */}
      {unscratchedCards.length > 0 && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
          border: '1px solid var(--accent-emerald)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)'
            }}>
              <Gift size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, color: '#fff' }}>
                You have {unscratchedCards.length} Unscratched Victory Card(s)!
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Earned from your recent squad tournament victory. Scratch now to reveal your reward!
              </p>
            </div>
          </div>

          <button
            className="btn btn-success"
            onClick={() => setCardToScratch(unscratchedCards[0])}
          >
            <span>Scratch Card Now</span>
            <Gift size={16} />
          </button>
        </div>
      )}

      {/* Shop Items Grid (Section 26 & 27) */}
      <div>
        <h2 style={{ fontSize: 20, marginBottom: 14 }}>Available Power-Ups in Shop</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {shopData.items.map((item) => {
            const canAfford = shopData.coins >= item.price_coins;
            return (
              <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {getItemIcon(item.item_key)}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#eab308' }}>
                      {item.price_coins} Coins
                    </span>
                  </div>

                  <h3 style={{ fontSize: 17, marginBottom: 6 }}>{item.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                    {item.description}
                  </p>
                </div>

                <button
                  className={`btn ${canAfford ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => handleBuy(item.id)}
                  disabled={!canAfford || buyingId === item.id}
                  style={{ width: '100%' }}
                >
                  {buyingId === item.id ? 'Purchasing...' : canAfford ? 'Purchase' : 'Not enough coins'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Inventory */}
      <div className="card">
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Your Power-Ups Inventory</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {inventory.map((inv) => (
            <div key={inv.id} style={{
              padding: '14px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {getItemIcon(inv.item_key)}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{inv.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Ready to use</div>
                </div>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-cyan)' }}>
                x{inv.quantity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History (Section 18 & 26) */}
      <div className="card">
        <h2 style={{ fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={18} color="var(--primary)" />
          <span>Reward & XP Transactions Audit Log</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* XP Transactions */}
          <div>
            <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 8 }}>
              Recent XP Changes
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {transactions.xpTransactions.slice(0, 6).map((tx) => (
                <div key={tx.id} style={{
                  padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12
                }}>
                  <span style={{ color: 'var(--text-main)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.reason}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>+{tx.amount} XP</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coin Transactions */}
          <div>
            <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 8 }}>
              Recent Coin Activity
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {transactions.coinTransactions.slice(0, 6).map((tx) => (
                <div key={tx.id} style={{
                  padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12
                }}>
                  <span style={{ color: 'var(--text-main)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.reason}
                  </span>
                  <span style={{
                    fontWeight: 700,
                    color: tx.transaction_type === 'EARNED' ? '#eab308' : 'var(--accent-rose)'
                  }}>
                    {tx.transaction_type === 'EARNED' ? `+${tx.amount}` : `-${tx.amount}`} Coins
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
