import { Rule, AppPreferencesState } from '../types';
import { SYSTEM_KEYWORDS_LIST, DEFAULT_REPLY, SOURCE_SYSTEM, SOURCE_USER } from './SystemKeywords';

const RULES_KEY = 'autoreply_rules_v1';
const PREFS_KEY = 'autoreply_preferences_v1';
const SYSTEM_REPLY_KEY = 'autoreply_system_reply_v1';

export class RuleRepositoryService {
  private static instance: RuleRepositoryService;

  static getInstance(): RuleRepositoryService {
    if (!this.instance) {
      this.instance = new RuleRepositoryService();
    }
    return this.instance;
  }

  // Get current rules (syncs from backend API if available, falls back to localStorage)
  async fetchRulesFromBackend(): Promise<Rule[]> {
    try {
      const res = await fetch('/api/rules');
      if (res.ok) {
        const rules: Rule[] = await res.json();
        this.saveRulesToDisk(rules);
        return rules;
      }
    } catch {
      // Offline or direct mode
    }
    return this.getRules();
  }

  getRules(): Rule[] {
    try {
      const stored = localStorage.getItem(RULES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading rules from storage:', e);
    }
    return this.seedSystemRules();
  }

  // Seed system rules if needed
  seedSystemRules(): Rule[] {
    const base = Date.now();
    const systemRules: Rule[] = SYSTEM_KEYWORDS_LIST.map((kw, idx) => ({
      id: String(idx + 1),
      keyword: kw,
      reply: this.getCurrentSystemReply(),
      targetApp: 'all',
      isEnabled: true,
      isExactMatch: false,
      source: SOURCE_SYSTEM,
      createdAt: base - (SYSTEM_KEYWORDS_LIST.length - idx) * 1000,
    }));
    this.saveRulesToDisk(systemRules);
    return systemRules;
  }

  private saveRulesToDisk(rules: Rule[]) {
    try {
      localStorage.setItem(RULES_KEY, JSON.stringify(rules));
    } catch (e) {
      console.error('Error saving rules:', e);
    }
  }

  async addRule(rule: Omit<Rule, 'id' | 'createdAt'>): Promise<Rule> {
    const newRule: Rule = {
      ...rule,
      id: String(Date.now()),
      createdAt: Date.now(),
      source: rule.source || SOURCE_USER,
    };

    // Attempt backend save
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });
      if (res.ok) {
        const serverRule = await res.json();
        const rules = [serverRule, ...this.getRules().filter((r) => r.id !== serverRule.id)];
        this.saveRulesToDisk(rules);
        return serverRule;
      }
    } catch {
      // Fallback local
    }

    const rules = [newRule, ...this.getRules()];
    this.saveRulesToDisk(rules);
    return newRule;
  }

  async updateRule(rule: Rule): Promise<Rule> {
    const rules = this.getRules();
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx !== -1) {
      rules[idx] = { ...rule };
      this.saveRulesToDisk(rules);
    }

    try {
      await fetch(`/api/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
    } catch {
      // Local fallback already saved
    }

    return rule;
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const rules = this.getRules();
    const filtered = rules.filter((r) => r.id !== ruleId);
    this.saveRulesToDisk(filtered);

    try {
      await fetch(`/api/rules/${ruleId}`, {
        method: 'DELETE',
      });
    } catch {
      // Fallback
    }

    return filtered.length < rules.length;
  }

  getCurrentSystemReply(): string {
    return localStorage.getItem(SYSTEM_REPLY_KEY) || DEFAULT_REPLY;
  }

  async updateAllSystemReplies(newReply: string): Promise<number> {
    localStorage.setItem(SYSTEM_REPLY_KEY, newReply);
    const rules = this.getRules();
    let count = 0;
    const updated = rules.map((r) => {
      if (r.source === SOURCE_SYSTEM) {
        count++;
        return { ...r, reply: newReply };
      }
      return r;
    });
    this.saveRulesToDisk(updated);

    try {
      await fetch('/api/rules/bulk-system-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: newReply }),
      });
    } catch {
      // Saved locally
    }

    return count;
  }

  async restoreMissingSystemKeywords(): Promise<number> {
    let restoredCount = 0;
    try {
      const res = await fetch('/api/rules/restore-system-keywords', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.restored) {
          restoredCount = data.restored;
          await this.fetchRulesFromBackend();
          return restoredCount;
        }
      }
    } catch {
      // Fallback to local logic
    }

    const rules = this.getRules();
    const existingKeywords = new Set(
      rules.filter((r) => r.source === SOURCE_SYSTEM).map((r) => r.keyword)
    );
    const missing = SYSTEM_KEYWORDS_LIST.filter((k) => !existingKeywords.has(k));

    if (missing.length === 0) return 0;

    const currentReply = this.getCurrentSystemReply();
    const base = Date.now();
    const newItems: Rule[] = missing.map((kw, i) => ({
      id: String(base + i),
      keyword: kw,
      reply: currentReply,
      targetApp: 'all',
      isEnabled: true,
      isExactMatch: false,
      source: SOURCE_SYSTEM,
      createdAt: base + i,
    }));

    const combined = [...newItems, ...rules];
    this.saveRulesToDisk(combined);
    return missing.length;
  }

  getSystemKeywordStats(): { existing: number; total: number } {
    const rules = this.getRules();
    const count = rules.filter((r) => r.source === SOURCE_SYSTEM).length;
    return { existing: count, total: SYSTEM_KEYWORDS_LIST.length };
  }

  getPreferences(): AppPreferencesState {
    const defaultTarget = localStorage.getItem('autoreply_global_target_app') || 'all';
    const defaults: AppPreferencesState = {
      negationFilterEnabled: true,
      duplicateWindowSeconds: 60,
      notificationAccessGranted: true,
      selectedAppsTarget: defaultTarget,
      activeAppPackages: [
        'com.whatsapp',
        'com.whatsapp.w4b',
        'com.gbwhatsapp',
        'com.whatsapp.plus',
        'org.telegram.messenger',
        'org.thunderdog.challegram',
        'org.telegram.plus',
      ],
    };
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        return { ...defaults, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error reading preferences:', e);
    }
    return defaults;
  }

  async savePreferences(prefs: Partial<AppPreferencesState>): Promise<AppPreferencesState> {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    if (updated.selectedAppsTarget) {
      localStorage.setItem('autoreply_global_target_app', updated.selectedAppsTarget);
    }
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negationFilterEnabled: updated.negationFilterEnabled,
          duplicateWindowSeconds: updated.duplicateWindowSeconds,
          selectedAppsTarget: updated.selectedAppsTarget,
          activeAppPackages: updated.activeAppPackages,
        }),
      });
    } catch (e) {
      console.error('Error saving preferences:', e);
    }
    return updated;
  }

  resetAllToDefaults(): void {
    localStorage.removeItem(RULES_KEY);
    localStorage.removeItem(PREFS_KEY);
    localStorage.removeItem(SYSTEM_REPLY_KEY);
    this.seedSystemRules();
  }
}

export const repository = RuleRepositoryService.getInstance();
