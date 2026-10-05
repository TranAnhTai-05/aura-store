import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

interface NavigateOptions {
  /** Replace the current history entry instead of adding one (redirects, filter changes) */
  replace?: boolean;
  /** Scroll back to the top of the page; on by default */
  scroll?: boolean;
}

interface RouterContextType {
  path: string;
  search: string;
  /** The fragment of the URL including the leading "#", or an empty string */
  hash: string;
  queryParams: URLSearchParams;
  navigate: (to: string, options?: NavigateOptions) => void;
  matchRoute: (pattern: string) => { match: boolean; params: Record<string, string> };
}

const RouterContext = createContext<RouterContextType | null>(null);

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(() => window.location.pathname || '/');
  const [search, setSearch] = useState<string>(() => window.location.search || '');
  const [hash, setHash] = useState<string>(() => window.location.hash || '');

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/');
      setSearch(window.location.search || '');
      setHash(window.location.hash || '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string, options: NavigateOptions = {}) => {
    const { replace = false, scroll = true } = options;
    const url = new URL(to, window.location.origin);
    const target = url.pathname + url.search + url.hash;
    const isSameLocation =
      url.pathname === window.location.pathname &&
      url.search === window.location.search &&
      url.hash === window.location.hash;

    if (!isSameLocation) {
      if (replace) window.history.replaceState({}, '', target);
      else window.history.pushState({}, '', target);
      setPath(url.pathname);
      setSearch(url.search);
      setHash(url.hash);
    }
    // A link to a section scrolls to that section, which the page itself takes care of
    if (scroll && !url.hash) {
      window.scrollTo({ top: 0, behavior: isSameLocation ? 'smooth' : 'auto' });
    }
  }, []);

  const queryParams = useMemo(() => new URLSearchParams(search), [search]);

  // Pattern matcher, e.g. /products/:id
  const matchRoute = useCallback(
    (pattern: string) => {
      const patternParts = pattern.split('/').filter(Boolean);
      const pathParts = path.split('/').filter(Boolean);

      if (patternParts.length !== pathParts.length) {
        return { match: false, params: {} };
      }

      const params: Record<string, string> = {};
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
          const paramName = patternParts[i].slice(1);
          try {
            params[paramName] = decodeURIComponent(pathParts[i]);
          } catch {
            params[paramName] = pathParts[i];
          }
        } else if (patternParts[i] !== pathParts[i]) {
          return { match: false, params: {} };
        }
      }

      return { match: true, params };
    },
    [path]
  );

  return (
    <RouterContext.Provider value={{ path, search, hash, queryParams, navigate, matchRoute }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

/** Sends the visitor elsewhere once rendered; used by the route guards */
export const Redirect: React.FC<{ to: string }> = ({ to }) => {
  const { navigate } = useRouter();
  useEffect(() => {
    navigate(to, { replace: true });
  }, [to, navigate]);
  return null;
};

/**
 * Where to go after signing in. Only paths inside the storefront are accepted, so a
 * crafted link cannot send the customer to another site or into the admin area.
 */
export function getSafeRedirect(value: string | null, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.startsWith('/admin') || value.startsWith('/login') || value.startsWith('/register')) {
    return fallback;
  }
  return value;
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
}

export const Link: React.FC<LinkProps> = ({
  to,
  children,
  className = '',
  activeClassName = '',
  onClick,
  ...rest
}) => {
  const { path, navigate } = useRouter();
  const target = to.split(/[?#]/)[0];
  const isActive = path === target || (target !== '/' && path.startsWith(target));

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;
    // Let the browser handle "open in new tab / window" gestures
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target === '_blank') {
      return;
    }
    e.preventDefault();
    navigate(to);
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={`${className} ${isActive ? activeClassName : ''}`}
      {...rest}
    >
      {children}
    </a>
  );
};
