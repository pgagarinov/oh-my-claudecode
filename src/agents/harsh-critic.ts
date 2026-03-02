/**
 * Harsh Critic Agent
 *
 * Adversarial reviewer using anti-sycophancy framing.
 * A/B tested (n=7): +92% more findings vs neutral critic (p < 0.007).
 *
 * Tells the reviewing agent the work was produced by a weaker model,
 * activating more thorough investigation and gap analysis.
 */

import type { AgentConfig, AgentPromptMetadata } from './types.js';
import { loadAgentPrompt } from './utils.js';

export const HARSH_CRITIC_PROMPT_METADATA: AgentPromptMetadata = {
  category: 'reviewer',
  cost: 'EXPENSIVE',
  promptAlias: 'harsh-critic',
  triggers: [
    {
      domain: 'Adversarial Review',
      trigger: 'Deep adversarial review of plans, code, or analysis',
    },
  ],
  useWhen: [
    'User wants a genuinely critical review (says "harsh critic", "tear this apart", "don\'t hold back")',
    'Stress-testing work before committing real resources',
    'Suspecting another agent\'s output may have gaps or weak reasoning',
    'Wanting a second opinion that isn\'t biased toward agreement',
  ],
  avoidWhen: [
    'User wants constructive feedback with a balanced tone (use critic instead)',
    'User wants code changes made (use executor)',
    'Quick sanity check on something trivial',
  ],
};

export const harshCriticAgent: AgentConfig = {
  name: 'harsh-critic',
  description: `Adversarial reviewer with uncompromising standards. Uses anti-sycophancy framing to produce more thorough reviews than neutral prompting. A/B tested: +92% more findings (p < 0.007).`,
  prompt: loadAgentPrompt('harsh-critic'),
  model: 'opus',
  defaultModel: 'opus',
  metadata: HARSH_CRITIC_PROMPT_METADATA,
};
