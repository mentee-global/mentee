import React from "react";
import { useLocation } from "react-router-dom";

// from: https://reactrouter.com/web/example/query-parameters
function useQuery() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default useQuery;
