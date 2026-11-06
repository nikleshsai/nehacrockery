// ─────────────────────────────────────────────────────────────────────────────
// Site settings → contact info (phone, WhatsApp, e-mail, address, map).
// Replaces the legacy "site settings engine" that rewrote the DOM; components now
// read live values from context, falling back to the original static defaults.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, createElement, Fragment, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getData } from './api';
import type { SiteSettings } from './types';

const DEFAULTS = {
  phone: '+91 97102 54681',
  whatsapp: '918870413413',
  email: 'nehacrockeryhouse2001@gmail.com',
  address: '13/3, Memorial Hall Road, Rattan Bazaar, Park Town, Chennai, Tamil Nadu 600003',
  hours: 'Mon – Sat: 10:30 AM – 7:30 PM',
};

export interface Contact {
  phoneDisplay: string;
  whatsappDisplay: string;
  telHref: string;
  mailHref: string;
  email: string;
  address: string;
  addressBr: ReactNode;
  mapsUrl: string;
  waNumber: string;
  /** Build a wa.me link with an optional pre-filled message. */
  wa: (text?: string) => string;
}

function digits(s: string): string {
  return s.replace(/\D/g, '');
}

function withCountryCode(n: string): string {
  return n.length === 10 ? `91${n}` : n;
}

function formatIndian(num: string, raw: string): string {
  return num.length === 12 ? `+91 ${num.slice(2, 7)} ${num.slice(7)}` : raw;
}

function mapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function computeContact(s?: Partial<SiteSettings> | null): Contact {
  const phoneRaw = s?.phone || DEFAULTS.phone;
  const whatsappRaw = s?.whatsapp || s?.phone || DEFAULTS.whatsapp;
  const waNumber = withCountryCode(digits(whatsappRaw));
  let telNumber = withCountryCode(digits(phoneRaw));
  if (!telNumber) telNumber = waNumber;
  const email = s?.email || DEFAULTS.email;
  const address = s?.address || DEFAULTS.address;

  const parts = address.split(/,\s*/);
  const addressBr: ReactNode =
    parts.length > 3
      ? createElement(
          Fragment,
          null,
          `${parts.slice(0, 3).join(', ')},`,
          createElement('br'),
          parts.slice(3).join(', '),
        )
      : address;

  return {
    phoneDisplay: formatIndian(telNumber, phoneRaw),
    whatsappDisplay: formatIndian(waNumber, whatsappRaw),
    telHref: `tel:+${telNumber}`,
    mailHref: `mailto:${email}`,
    email,
    address,
    addressBr,
    mapsUrl: s?.googleMapsUrl || mapsSearchUrl(address),
    waNumber,
    wa: (text) => `https://wa.me/${waNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`,
  };
}

const ContactContext = createContext<Contact>(computeContact());

const CACHE_KEY = 'nch_site_settings';
const CACHE_TTL = 5 * 60 * 1000;

function readCache(): SiteSettings | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: SiteSettings };
    return Date.now() - parsed.ts < CACHE_TTL ? parsed.data : null;
  } catch {
    return null;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(() => readCache());

  useEffect(() => {
    if (settings) return;
    const ctrl = new AbortController();
    getData<SiteSettings>('/site-settings', ctrl.signal)
      .then((data) => {
        setSettings(data);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
        } catch {
          /* storage unavailable */
        }
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => ctrl.abort();
  }, [settings]);

  const contact = useMemo(() => computeContact(settings), [settings]);
  return createElement(ContactContext.Provider, { value: contact }, children);
}

export function useContact(): Contact {
  return useContext(ContactContext);
}

export { DEFAULTS as CONTACT_DEFAULTS };
