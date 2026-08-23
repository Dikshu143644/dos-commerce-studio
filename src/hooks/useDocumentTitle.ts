import { useEffect } from 'react';

/**
 * Sets the document title with a consistent suffix pattern.
 * @param title - The page-specific title (e.g. "Dashboard")
 * @param suffix - Optional suffix, defaults to "StockFlow"
 */
export function useDocumentTitle(title: string, suffix = 'StockFlow') {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | ${suffix}`;
    return () => {
      document.title = previousTitle;
    };
  }, [title, suffix]);
}
