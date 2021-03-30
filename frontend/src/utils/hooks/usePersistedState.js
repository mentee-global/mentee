import React, { useEffect } from "react";

// Bless this person...
// Source:
// https://dev.to/selbekk/persisting-your-react-state-in-9-lines-of-code-9go
export default function usePersistedState(key, defaultValue) {
  const [state, setState] = React.useState(
    () => JSON.parse(localStorage.getItem(key)) || defaultValue
  );
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState];
}
