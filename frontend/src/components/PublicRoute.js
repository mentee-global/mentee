import React from "react";
import { Redirect, Route } from "react-router-dom";
import { getProfileId, getRole } from "utils/auth.service";
import { REDIRECTS } from "utils/consts";

function PublicRoute({ children, ...rest }) {
  return (
    <Route
      {...rest}
      render={() =>
        !getRole() ? children : <Redirect to={REDIRECTS[getRole()]} />
      }
    />
  );
}

export default PublicRoute;
