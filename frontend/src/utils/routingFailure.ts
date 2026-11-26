export const MAX_ROUTING_ATTEMPTS = 3;

export type RoutingFailureKind = 'route' | 'invoice' | 'coordinator' | 'unknown';

export interface RoutingRetryProgress {
  attempt: number;
  total: number;
}

export interface RetryCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface RoutingFailureReportOrder {
  id: number;
  shortAlias: string;
  failure_reason?: string | null;
}

const pad = (value: number): string => String(value).padStart(2, '0');

export const getRoutingRetryProgress = (retries?: number | null): RoutingRetryProgress | null => {
  if (typeof retries !== 'number' || !Number.isInteger(retries)) return null;
  if (retries < 1 || retries >= MAX_ROUTING_ATTEMPTS) return null;
  return { attempt: retries, total: MAX_ROUTING_ATTEMPTS };
};

export const getRoutingFailureKind = (failureReason?: string | null): RoutingFailureKind => {
  const reason = (failureReason ?? '').toLowerCase();
  if (reason.includes('balance') || reason.includes('non-recoverable')) return 'coordinator';
  if (reason.includes('incorrect')) return 'invoice';
  if (reason.includes('route') || reason.includes('timeout')) return 'route';
  return 'unknown';
};

export const formatRetryCountdown = ({ days, hours, minutes, seconds }: RetryCountdown): string => {
  const totalHours = days * 24 + hours;
  const minutesAndSeconds = `${pad(minutes)}m ${pad(seconds)}s`;
  return totalHours > 0 ? `${pad(totalHours)}h ${minutesAndSeconds}` : minutesAndSeconds;
};

export const routingFailureReport = ({
  id,
  shortAlias,
  failure_reason,
}: RoutingFailureReportOrder): string => {
  const reason = failure_reason ? failure_reason : 'no failure reason reported';
  return `RoboSats order ${id} (coordinator: ${shortAlias})\nLightning payout failed: ${reason}`;
};
