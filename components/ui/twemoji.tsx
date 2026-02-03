'use client';

import React from 'react';
import twemoji from 'twemoji';

interface TwemojiProps {
  emoji: string;
  className?: string;
}

export function Twemoji({ emoji, className }: TwemojiProps) {
  const html = twemoji.parse(emoji, {
    folder: 'svg',
    ext: '.svg',
  });

  // Extract the URL from the generated HTML
  // Twemoji parse returns something like: <img class="emoji" draggable="false" alt="🍕" src="https://twemoji.maxcdn.com/v/latest/svg/1f355.svg"/>
  const match = html.match(/src="([^"]+)"/);
  const src = match ? match[1] : '';

  if (!src) return <span>{emoji}</span>;

  return (
    <img
      src={src}
      alt={emoji}
      draggable={false}
      className={className || 'h-[1em] w-[1em] inline-block align-middle'}
    />
  );
}
