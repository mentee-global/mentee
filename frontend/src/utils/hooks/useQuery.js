import React, { useEffect, useState } from "react";
import { NavLink, withRouter, useLocation } from "react-router-dom";

// from: https://reactrouter.com/web/example/query-parameters
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

export default useQuery;
