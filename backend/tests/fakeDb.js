/** In-memory stand-in for the `pg` driver: each test lists [pattern, rows] rules for the SQL it expects. */
// Shared on globalThis so a module reset still talks to the same instance.
export const db = (globalThis.__fakeDb ??= {
  calls: [],
  rules: [],
  ended: 0,
  reset(rules = []) {
    this.calls = [];
    this.rules = rules;
    this.ended = 0;
  },
  async query(text, params) {
    this.calls.push({ text, params });
    const rule = this.rules.find(([pattern]) => pattern.test(text));
    if (!rule) return { rows: [] };
    const rows = typeof rule[1] === 'function' ? await rule[1](params, text) : rule[1];
    return { rows };
  },
  find(pattern) {
    return this.calls.find((c) => pattern.test(c.text));
  },
});

export class Pool {
  query(text, params) {
    return db.query(text, params);
  }
  async connect() {
    return { query: (text, params) => db.query(text, params), release() {} };
  }
  async end() {
    db.ended += 1;
  }
}
