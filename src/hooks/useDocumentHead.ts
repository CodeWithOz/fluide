import { useEffect } from 'react';

export interface DocumentHeadMetadata {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  canonicalUrl?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

/**
 * Hook to manage document head metadata for SEO and social sharing.
 * Syncs title and meta tags from JS so they stay in sync with the app
 * (e.g. after hydration, or for future per-route overrides).
 */
export function useDocumentHead(metadata: DocumentHeadMetadata): void {
  useEffect(() => {
    document.title = metadata.title;

    const setMetaTag = (
      selector: string,
      attribute: 'name' | 'property',
      attributeValue: string,
      content: string
    ) => {
      let tag = document.querySelector(selector) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, attributeValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    setMetaTag('meta[name="description"]', 'name', 'description', metadata.description);

    const ogTitle = metadata.ogTitle ?? metadata.title;
    const ogDescription = metadata.ogDescription ?? metadata.description;

    setMetaTag('meta[property="og:title"]', 'property', 'og:title', ogTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', ogDescription);

    if (metadata.ogType) {
      setMetaTag('meta[property="og:type"]', 'property', 'og:type', metadata.ogType);
    }
    if (metadata.ogUrl) {
      setMetaTag('meta[property="og:url"]', 'property', 'og:url', metadata.ogUrl);
    }
    if (metadata.ogImage) {
      setMetaTag('meta[property="og:image"]', 'property', 'og:image', metadata.ogImage);
    }

    if (metadata.canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', metadata.canonicalUrl);
    }

    const twitterCard = metadata.twitterCard ?? 'summary_large_image';
    const twitterTitle = metadata.twitterTitle ?? ogTitle;
    const twitterDescription = metadata.twitterDescription ?? ogDescription;

    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', twitterCard);
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', twitterTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', twitterDescription);

    if (metadata.twitterImage ?? metadata.ogImage) {
      setMetaTag(
        'meta[name="twitter:image"]',
        'name',
        'twitter:image',
        metadata.twitterImage ?? metadata.ogImage!
      );
    }
  }, [
    metadata.title,
    metadata.description,
    metadata.ogTitle,
    metadata.ogDescription,
    metadata.ogImage,
    metadata.ogUrl,
    metadata.canonicalUrl,
    metadata.ogType,
    metadata.twitterCard,
    metadata.twitterTitle,
    metadata.twitterDescription,
    metadata.twitterImage,
  ]);
}
