declare module 'emoji-name-map' {
  const emojiMap: {
    emoji: Record<string, string>;
    get: (name: string) => string | undefined;
  };
  export default emojiMap;
}
