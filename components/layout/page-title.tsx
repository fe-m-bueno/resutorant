'use client';

import { useEffect } from 'react';
import { useLayout } from './layout-context';

export function PageTitle({ title }: { title: string }) {
  const { setTitle } = useLayout();

  useEffect(() => {
    setTitle(title);
  }, [title, setTitle]);

  return null;
}
