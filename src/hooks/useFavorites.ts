import { useState, useCallback } from 'react';

export type Favorites = string[]; // тикеры в верхнем регистре

export function useFavorites() {
  const [list, setList] = useState<Favorites>(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch {
      return [];
    }
  });

  const toggle = useCallback((s: string) => {
    const u = s.toUpperCase();
    setList(prev => {
      const next = prev.includes(u) 
        ? prev.filter(x => x !== u) 
        : [u, ...prev];
      localStorage.setItem('favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const has = useCallback((s: string) => {
    return list.includes(s.toUpperCase());
  }, [list]);

  const add = useCallback((s: string) => {
    const u = s.toUpperCase();
    if (!list.includes(u)) {
      setList(prev => {
        const next = [u, ...prev];
        localStorage.setItem('favorites', JSON.stringify(next));
        return next;
      });
    }
  }, [list]);

  const remove = useCallback((s: string) => {
    const u = s.toUpperCase();
    setList(prev => {
      const next = prev.filter(x => x !== u);
      localStorage.setItem('favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setList([]);
    localStorage.removeItem('favorites');
  }, []);

  return { 
    list, 
    toggle, 
    has, 
    add, 
    remove, 
    clear 
  };
}
