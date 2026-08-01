// DecisionCache memoizes authorization decisions.
export class DecisionCache {
  constructor(fetchPolicy) {
    this.fetchPolicy = fetchPolicy;
    this.values = new Map();
  }

  async can(request) {
    const key = request.resourceId;
    if (this.values.has(key)) {
      return this.values.get(key);
    }
    const policy = await this.fetchPolicy(request);
    const allowed = Array.isArray(policy.allow) && policy.allow.includes(request.action);
    this.values.set(key, allowed);
    return allowed;
  }

  clear() {
    this.values.clear();
  }

  size() {
    return this.values.size;
  }
}
