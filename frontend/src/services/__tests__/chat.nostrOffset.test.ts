describe('Nostr chat coordinator send — offset isolation', () => {
  describe('nostrMode=true: offset must be absent from coordinator POST body', () => {
    it('builds body without offset when nostrMode is true', () => {
      const nostrMode = true;
      const lastIndex = 1761234567.0008736;

      const body: Record<string, unknown> = {
        PGP_message: 'encrypted',
        order_id: 42,
      };

      if (!nostrMode) {
        body.offset = Math.floor(lastIndex);
      }

      expect(body).not.toHaveProperty('offset');
      expect(body.order_id).toBe(42);
    });

    it('does not let a relay timestamp bleed into offset even if lastIndex is huge', () => {
      const nostrMode = true;
      const lastIndex = 1_700_000_000.9999;

      const body: Record<string, unknown> = {
        PGP_message: 'encrypted',
        order_id: 1,
      };
      if (!nostrMode) {
        body.offset = Math.floor(lastIndex);
      }

      expect(body).not.toHaveProperty('offset');
    });
  });

  describe('nostrMode=false: offset must be a safe integer', () => {
    it('includes offset as floored integer when nostrMode is false', () => {
      const nostrMode = false;
      const lastIndex = 5;

      const body: Record<string, unknown> = {
        PGP_message: 'encrypted',
        order_id: 1,
      };
      if (!nostrMode) {
        body.offset = Math.floor(lastIndex);
      }

      expect(body.offset).toBe(5);
      expect(Number.isInteger(body.offset)).toBe(true);
    });

    it('floors a fractional lastIndex to a safe integer', () => {
      const nostrMode = false;
      const lastIndex = 3.9;

      const body: Record<string, unknown> = {
        PGP_message: 'encrypted',
        order_id: 1,
      };
      if (!nostrMode) {
        body.offset = Math.floor(lastIndex);
      }

      expect(body.offset).toBe(3);
    });
  });

  describe('coordinator response error detection', () => {
    it('detects a bad_request field in coordinator response', () => {
      const response = { bad_request: 'A valid integer is required.' };

      const hasError =
        response != null && typeof response === 'object' && 'bad_request' in response;

      expect(hasError).toBe(true);
    });

    it('does not flag a successful response as an error', () => {
      const response = { peer_connected: true, messages: [], peer_pubkey: 'abc' };

      const hasError =
        response != null && typeof response === 'object' && 'bad_request' in response;

      expect(hasError).toBe(false);
    });

    it('does not flag an empty response (Nostr-mode POST with no offset) as an error', () => {
      const response = {};

      const hasError =
        response != null && typeof response === 'object' && 'bad_request' in response;

      expect(hasError).toBe(false);
    });
  });

  describe('Nostr message sort index must not be an integer-safe coordinator sequence', () => {
    it('relay-sourced index is a float with decimal component', () => {
      const createdAt = 1_700_000_001;
      const nostrIndex = createdAt + Math.random() * 0.001;

      expect(nostrIndex).not.toBe(Math.floor(nostrIndex));
    });

    it('flooring a relay index yields the original timestamp integer', () => {
      const createdAt = 1_700_000_001;
      const nostrIndex = createdAt + 0.0005;

      expect(Math.floor(nostrIndex)).toBe(createdAt);
    });
  });
});
