import type { AgentEventType } from '@/lib/domain';

export interface ReplayEventRecord {
  type: AgentEventType;
  title: string;
  payload: Record<string, unknown>;
  screenshotUrl?: string;
  createdAt: string;
}

export function createReplayEvent(type: AgentEventType, title: string, payload: Record<string, unknown>, screenshotUrl?: string): ReplayEventRecord {
  return {
    type,
    title,
    payload,
    screenshotUrl,
    createdAt: new Date().toISOString(),
  };
}
