import { useEffect } from 'react';

export function useTitle(thing: string) {
  useEffect(() => {
    document.title = `${thing} · ESP32 bench guide`;
  }, [thing]);
}
