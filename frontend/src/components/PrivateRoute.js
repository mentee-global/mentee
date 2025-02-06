import React from "react";
import { Route, Redirect } from "react-router-dom";
import { getRole } from "utils/auth.service";

function PrivateRoute({ children, ...rest }) {
  var path = rest.path;
  var login_url = "/login";
  if (path.indexOf("/new_training") > 0) {
    login_url = "/" + path.split("/")[1];
  }
  if (path.indexOf("/event") > 0) {
    login_url = "/" + path.split("/")[1];
  }

  return (
    <Route
      {...rest}
      render={({ location }) =>
        getRole() ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: login_url,
              state: { from: location },
            }}
          />
        )
      }
    />
  );
}

export default PrivateRoute;
