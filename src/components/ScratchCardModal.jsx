import React, { useRef, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Gift, CheckCircle, X } from 'lucide-react';
import { api } from '../api';

export default function ScratchCardModal({ card, onClose, onRevealed }) {
  const canvasRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(card.is_scratched === 1);
  const [revealedData, setRevealedData] = useState(card.is_scratched === 1 ? {
    rewardType: card.reward_type,
    rewardTitle: card.reward_title
  } : null);
  const [scratchPercent, setScratchPercent] = useState(card.is_scratched === 1 ? 100 : 0);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (isRevealed || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Draw metallic scratch-off coating
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#94a3b8');
    grad.addColorStop(0.5, '#cbd5e1');
    grad.addColorStop(1, '#64748b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative text on coating
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ SCRATCH HERE TO REVEAL ✨', width / 2, height / 2 - 10);
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Move mouse or finger across', width / 2, height / 2 + 15);
  }, [isRevealed]);

  const handleScratch = (e) => {
    if (isRevealed || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    if (!clientX || !clientY) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Check scratch progress periodically
    checkScratchProgress(ctx, canvas.width, canvas.height);
  };

  const checkScratchProgress = (ctx, w, h) => {
    if (isRevealed) return;
    try {
      const imageData = ctx.getImageData(0, 0, w, h);
      const pixels = imageData.data;
      let transparentCount = 0;
      for (let i = 3; i < pixels.length; i += 16) {
        if (pixels[i] === 0) transparentCount++;
      }
      const totalSampled = pixels.length / 16;
      const pct = Math.round((transparentCount / totalSampled) * 100);
      setScratchPercent(pct);

      if (pct > 35 && !isRevealed) {
        triggerReveal();
      }
    } catch (e) {
      // Ignore security cross-origin in tests
    }
  };

  const triggerReveal = async () => {
    setIsRevealed(true);
    try {
      const data = await api.rewards.revealScratchCard(card.id);
      setRevealedData(data);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      if (onRevealed) onRevealed();
    } catch (err) {
      console.error('Failed to reveal scratch card:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, textAlign: 'center', padding: '28px 24px' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', marginBottom: 12 }}>
          <Gift size={32} />
        </div>
        <h2 style={{ fontSize: 22, marginBottom: 6 }}>Victory Scratch Card</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          {isRevealed ? 'Reward unlocked and credited to your inventory!' : 'Scratch the metallic card below to reveal your prize.'}
        </p>

        <div className="scratch-card-wrapper" style={{ width: 340, height: 190 }}>
          {/* Underlying Prize */}
          <div className="scratch-card-reveal">
            <Sparkles size={36} color="#eab308" style={{ marginBottom: 8 }} />
            <h3 style={{ fontSize: 18, color: '#fff', marginBottom: 4 }}>
              {revealedData?.rewardTitle || card.reward_title || 'Secret Reward'}
            </h3>
            <span style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600 }}>
              {revealedData?.rewardType || card.reward_type}
            </span>
          </div>

          {/* Foreground Scratchable Canvas */}
          {!isRevealed && (
            <canvas
              ref={canvasRef}
              width={340}
              height={190}
              className="scratch-card-canvas"
              onMouseDown={() => (isDrawing.current = true)}
              onMouseUp={() => (isDrawing.current = false)}
              onMouseMove={(e) => isDrawing.current && handleScratch(e)}
              onTouchMove={handleScratch}
            />
          )}
        </div>

        {!isRevealed ? (
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Scratched: {scratchPercent}%</span>
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-secondary btn-sm" onClick={triggerReveal}>
                Reveal Instantly
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-emerald)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
              <CheckCircle size={18} /> Added to your inventory
            </div>
            <div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
                Claim Reward & Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
