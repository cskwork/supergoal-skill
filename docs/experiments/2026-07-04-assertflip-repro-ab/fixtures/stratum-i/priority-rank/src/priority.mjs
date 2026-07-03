const RANKS = {
  urgent: 1,
  high: 2,
  normal: 3,
  low: 4,
};

export function priorityRank(label) {
  return RANKS[label] || 0;
}

