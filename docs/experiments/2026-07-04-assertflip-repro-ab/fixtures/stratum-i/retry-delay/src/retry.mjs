export function retryDelayMs(attempt) {
  return 100 * (2 ** attempt);
}

