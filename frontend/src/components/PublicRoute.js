import React from "react";
import { Redirect, Route } from "react-router-dom";
import { getRole, getLoginPath } from "utils/auth.service";
import { ACCOUNT_TYPE, REDIRECTS } from "utils/consts";

function PublicRoute({ children, ...rest }) {
  var role = getRole();
  var login_path = "";
  if (role == ACCOUNT_TYPE.HUB) {
    login_path = getLoginPath();
    if (!login_path) login_path = "";
  }
  return (
    <Route
      {...rest}
      render={() =>
        !role ? (
          children
        ) : (
          <Redirect
            to={
              role == ACCOUNT_TYPE.HUB
                ? login_path + REDIRECTS[role]
                : REDIRECTS[role]
            }
          />
        )
      }
    />
  );
}

export default PublicRoute;
