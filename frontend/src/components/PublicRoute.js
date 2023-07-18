import React from "react";
import { Redirect, Route } from "react-router-dom";
import { getRole, getUserIdToken } from "utils/auth.service";
import { REDIRECTS } from "utils/consts";

function PublicRoute({ children, ...rest }) {
  return (
    <Route
      {...rest}
      render={() =>
        !getUserIdToken() && !getRole() ? (
          children
        ) : (
          <Redirect to={REDIRECTS[getRole()]} />
        )
      }
    />
  );
}

export default PublicRoute;
