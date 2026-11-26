import { signCleartextMessage } from '../pgp';

export const ACTION_SIGNATURE_WINDOW = 300;

export function orderActionContent(action: string, orderId: number, shortAlias: string): string {
  return `${action}:${orderId}:${shortAlias}`;
}

export function timedActionContent(action: string): string {
  return `${action}:${Math.floor(Date.now() / 1000)}`;
}

export function reviewActionContent(pubkey: string): string {
  return `review:${pubkey}`;
}

export async function signAction(
  content: string,
  encPrivKey?: string,
  token?: string,
): Promise<string | undefined> {
  if (!encPrivKey || !token) return undefined;
  return await signCleartextMessage(content, encPrivKey, token);
}
