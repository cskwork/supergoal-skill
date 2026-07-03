export function averageRating(ratings) {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, rating) => sum + (rating ?? 0), 0);
  return total / ratings.length;
}

