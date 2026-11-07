// ─────────────────────────────────────────────────────────────────────────────
// Shared hooks for the public site
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { getData, request } from './api';
import type { Brand, Catalogue, Category, Product } from './types';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/** Fetch a public API path once (re-runs when `path` changes). */
export function useApiData<T>(path: string | null): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: Boolean(path), error: null });

  useEffect(() => {
    if (!path) return;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    getData<T>(path, ctrl.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setState({ data: null, loading: false, error });
      });
    return () => ctrl.abort();
  }, [path]);

  return state;
}

/** Load every active product (follows pagination, 500 per page). */
export function useAllProducts(): AsyncState<Product[]> & { retry: () => void } {
  const [state, setState] = useState<AsyncState<Product[]>>({ data: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    (async () => {
      try {
        const first = await request<Product[]>('/products?active=true&pageSize=500&sortBy=name&sortOrder=asc&page=1');
        let all = first.data;
        if (!cancelled) setState({ data: all, loading: true, error: null });
        const totalPages = first.pagination?.totalPages ?? 1;
        const actualPageSize = first.pagination?.pageSize ?? 500;
        for (let p = 2; p <= totalPages; p++) {
          const next = await request<Product[]>(
            `/products?active=true&pageSize=${actualPageSize}&sortBy=name&sortOrder=asc&page=${p}`,
          );
          all = all.concat(next.data);
          if (!cancelled) setState({ data: all, loading: p < totalPages, error: null });
        }
        if (!cancelled) setState({ data: all, loading: false, error: null });
      } catch (e) {
        if (!cancelled) setState({ data: null, loading: false, error: e as Error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return {
    ...state,
    retry: () => setAttempt((a) => a + 1),
  };
}

export function useBrands(): AsyncState<Brand[]> {
  return useApiData<Brand[]>('/brands');
}

export function useCategories(): AsyncState<Category[]> {
  return useApiData<Category[]>('/categories');
}

/** First active catalogue that has a downloadable file. */
export function useCatalogue(): Catalogue | null {
  const { data } = useApiData<Catalogue[]>('/catalogues');
  return data?.find((c) => c.fileUrl) ?? null;
}

/** Count-up animation for `.hero-stats .stat-number` values ending in "+". */
export function useStatCounters(): void {
  useEffect(() => {
    const section = document.querySelector('.hero-stats');
    if (!section || !('IntersectionObserver' in window)) return;

    const animate = (el: Element, end: number, suffix: string) => {
      const duration = 1600;
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${Math.round(eased * end)}${suffix}`;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          section.querySelectorAll('.stat-number').forEach((el) => {
            const text = (el.textContent ?? '').trim();
            const end = parseInt(text, 10);
            if (text.endsWith('+') && !Number.isNaN(end)) animate(el, end, '+');
          });
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);
}

/** Scroll-reveal for legacy `.reveal` styling; re-runs on route change. */
export function useReveal(routeKey: string): void {
  useEffect(() => {
    const add = (sel: string, ...cls: string[]) =>
      document.querySelectorAll(sel).forEach((el, i) => {
        el.classList.add('reveal', ...cls.map((c) => c.replace('{i}', String(i + 1))));
      });

    add('.section-header');
    add('.page-banner-content');
    add('.about-img-col');
    document.querySelectorAll('.about-text-col').forEach((el) => el.classList.add('reveal', 'reveal-delay-2'));
    add('.about-feature-item', 'reveal-delay-{i}');
    add('.contact-card', 'reveal-delay-{i}');

    const targets = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('visible'));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    targets.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [routeKey]);
}
