import { describe, expect, it } from 'vitest';
import { computeContact } from '@/lib/settings';

describe('computeContact', () => {
  it('falls back to defaults', () => {
    const c = computeContact(null);
    expect(c.waNumber).toBe('918870413413');
    expect(c.telHref).toBe('tel:+919710254681');
  });

  it('uses site settings and prefixes 10-digit numbers with 91', () => {
    const c = computeContact({ businessName: 'x', phone: '9876543210', whatsapp: '9876543210', email: 'a@b.com' });
    expect(c.waNumber).toBe('919876543210');
    expect(c.phoneDisplay).toBe('+91 98765 43210');
    expect(c.mailHref).toBe('mailto:a@b.com');
  });

  it('builds wa.me links with encoded text', () => {
    expect(computeContact(null).wa('Hi there')).toBe('https://wa.me/918870413413?text=Hi%20there');
  });
});

