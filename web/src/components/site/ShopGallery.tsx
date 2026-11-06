import { useEffect, useState } from 'react';
import { useApiData } from '@/lib/hooks';
import type { ShopMedia } from '@/lib/types';

export function ShopGallery() {
  const { data: items, loading, error } = useApiData<ShopMedia[]>('/shop-media');
  const [lightbox, setLightbox] = useState<ShopMedia | null>(null);

  useEffect(() => {
    if (!lightbox) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [lightbox]);

  if (loading) {
    return (
      <div className="shop-gallery-grid" id="shop-gallery-wrap">
        <p className="gallery-loading">Loading gallery...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shop-gallery-grid" id="shop-gallery-wrap">
        <p className="gallery-empty">Could not load gallery.</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="shop-gallery-grid" id="shop-gallery-wrap">
        <p className="gallery-empty">
          Showroom photos and videos coming soon. Visit us at Memorial Hall Road, Park Town, Chennai.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="shop-gallery-grid" id="shop-gallery-wrap">
        {items.map((item) => {
          const isVideo = item.mediaType === 'video';
          const label = item.title || (isVideo ? 'Shop video' : 'Shop photo');
          return (
            <div
              key={item.id}
              className={`gallery-item${isVideo ? ' gallery-item--video' : ''}`}
              tabIndex={0}
              role="button"
              aria-label={label}
              onClick={() => setLightbox(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setLightbox(item);
                }
              }}
            >
              <div className="gallery-item-inner">
                {isVideo ? (
                  <>
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={label} loading="lazy" />
                    ) : (
                      <div className="gallery-video-placeholder">
                        <span className="gallery-play-icon">&#9654;</span>
                      </div>
                    )}
                    <div className="gallery-video-badge">
                      <span>&#9654;</span> Video
                    </div>
                  </>
                ) : (
                  <>
                    <img src={item.mediaUrl} alt={item.title || 'Neha Crockery House'} loading="lazy" />
                    <div className="gallery-overlay">
                      <span className="gallery-zoom-icon">&#8853;</span>
                    </div>
                  </>
                )}
              </div>
              {item.title && <p className="gallery-caption">{item.title}</p>}
            </div>
          );
        })}
      </div>

      {lightbox && (
        <div
          id="shop-lightbox"
          role="dialog"
          aria-modal="true"
          style={{
            display: 'flex',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.88)',
            zIndex: 9999,
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightbox(null);
          }}
        >
          <button
            className="lightbox-close"
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '16px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '2.5rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
            onClick={() => setLightbox(null)}
          >
            &times;
          </button>
          <div className="lightbox-inner" style={{ textAlign: 'center' }}>
            {lightbox.mediaType === 'video' ? (
              <video controls autoPlay style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px' }}>
                <source src={lightbox.mediaUrl} />
              </video>
            ) : (
              <img
                src={lightbox.mediaUrl}
                alt={lightbox.title || ''}
                style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', objectFit: 'contain' }}
              />
            )}
            {lightbox.title && <p className="lightbox-caption">{lightbox.title}</p>}
          </div>
        </div>
      )}
    </>
  );
}

