/**
 * Trade advice verdict — BUY / HOLD / AVOID based on live technical data
 */

function parseChange(change) {
  if (change == null || change === 'N/A') return 0;
  const s = String(change);
  const n = parseFloat(s.replace(/[^0-9.\-+]/g, '')) || 0;
  if (s.includes('-') && n > 0) return -n;
  return n;
}

export function computeVerdict({ spot, change, levels, market, symbol, timeframe }) {
  const changeNum = parseChange(change);
  let score = 0;
  const reasons = [];

  if (changeNum >= 2) {
    score += 2;
    reasons.push(`Strong uptrend — aaj +${changeNum.toFixed(2)}%`);
  } else if (changeNum >= 0.5) {
    score += 1;
    reasons.push(`Positive momentum (+${changeNum.toFixed(2)}%)`);
  } else if (changeNum <= -2) {
    score -= 2;
    reasons.push(`Strong selling — ${changeNum.toFixed(2)}% giravat`);
  } else if (changeNum <= -0.5) {
    score -= 1;
    reasons.push(`Weak momentum (${changeNum.toFixed(2)}%)`);
  } else {
    reasons.push('Sideways / flat movement');
  }

  if (spot && levels) {
    const s = Number(spot);
    const sup = Number(levels.support);
    const res = Number(levels.resistance);
    const range = res - sup || 1;
    const posInRange = (s - sup) / range;

    if (posInRange <= 0.25 && changeNum >= 0) {
      score += 2;
      reasons.push('Price support zone ke paas — dip buying opportunity');
    } else if (posInRange >= 0.85) {
      score -= 2;
      reasons.push('Price resistance ke bahut paas — upside risky, wait for breakout');
    } else if (posInRange >= 0.65 && changeNum > 0) {
      score += 1;
      reasons.push('Uptrend mein upper range — momentum strong');
    } else if (posInRange <= 0.35 && changeNum < 0) {
      score -= 2;
      reasons.push('Support ke neeche pressure — breakdown risk');
    } else if (posInRange >= 0.4 && posInRange <= 0.6) {
      reasons.push('Range ke beech mein — clear direction ka wait karo');
    }
  } else {
    reasons.push('Live price limited — chart pe confirm karo');
  }

  let action;
  let actionHi;
  let emoji;
  let actionDetail;

  if (score >= 3) {
    action = 'BUY';
    actionHi = 'HAAN — KHAREED SAKTE HO';
    emoji = '🟢';
    actionDetail = 'Trend bullish hai. Support pe SL rakho, targets follow karo.';
  } else if (score >= 1) {
    action = 'BUY ON DIP';
    actionHi = 'DIP PE KHAREEDO — ABHI THODA WAIT';
    emoji = '🟡';
    actionDetail = 'Bias positive hai lekin best entry support ke paas. Abhi chase mat karo.';
  } else if (score <= -2) {
    action = 'AVOID';
    actionHi = 'NAHI — ABHI MAT KHAREEDO';
    emoji = '🔴';
    actionDetail = 'Weak setup. Selling pressure ya resistance block. Fresh buy avoid karo.';
  } else if (score <= -1) {
    action = 'SELL / EXIT';
    actionHi = 'BECHO YA EXIT — WEAK';
    emoji = '🟠';
    actionDetail = 'Agar holding ho to trail SL ya partial exit socho. New buy mat lo.';
  } else {
    action = 'HOLD';
    actionHi = 'HOLD / WAIT — ABHI KUCH MAT KARO';
    emoji = '🟡';
    actionDetail = 'Clear signal nahi. Breakout ya support test ka wait karo.';
  }

  const confidence = Math.min(9, Math.max(5, 5 + Math.abs(score)));

  const invalidation = levels
    ? `Agar ${levels.support} ke neeche close ho → view cancel`
    : 'Key support break = plan cancel';

  const entry = levels
    ? `Entry: ${levels.support} – ${spot} zone | SL: ${levels.sl}`
    : 'Entry: chart support pe confirm karo';

  return {
    symbol: symbol || 'N/A',
    timeframe: timeframe || '15m',
    market,
    action,
    actionHi,
    emoji,
    actionDetail,
    score,
    confidence,
    reasons,
    invalidation,
    entry,
    summary: `${emoji} ${actionHi} — ${symbol} (${timeframe}) | Confidence ${confidence}/10`
  };
}

export function formatVerdictBlock(verdict) {
  if (!verdict) return '';
  const reasons = verdict.reasons.map((r) => `  • ${r}`).join('\n');
  return `${verdict.emoji} ═══════════════════════════════════
   ADVICE: ${verdict.actionHi}
   Signal: ${verdict.action} | Confidence: ${verdict.confidence}/10
═══════════════════════════════════

📝 ${verdict.actionDetail}

KYUN?
${reasons}

📌 ${verdict.entry}
⚠️ ${verdict.invalidation}

`;
}
