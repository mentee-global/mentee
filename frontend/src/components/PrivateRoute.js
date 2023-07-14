import React from "react";
import { Route, Redirect } from "react-router-dom";
import { useAuth } from "utils/hooks/useAuth";

function PrivateRoute({ children, ...rest }) {
  const { profileId } = useAuth();
  return (
    <Route
      {...rest}
      render={({ location }) =>
        profileId ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location },
            }}
          />
        )
      }
    />
  );
}

export default PrivateRoute;
