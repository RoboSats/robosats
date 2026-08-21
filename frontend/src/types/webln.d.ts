// WebLN type augmentation: sendPaymentAsync is not in the official @types/webln
// but is required for hold invoices (HTLC-only, does not wait for settlement).
// See: https://www.webln.dev/docs/api-reference/sendpayment
import 'webln';

declare module 'webln' {
  interface WebLNProvider {
    /**
     * Fire-and-forget payment for hold invoices. Returns immediately after
     * the HTLC is sent without waiting for settlement. Required for bond
     * and escrow hold invoices where settlement happens at coordinator-side.
     */
    sendPaymentAsync(paymentRequest: string): void;
  }
}
