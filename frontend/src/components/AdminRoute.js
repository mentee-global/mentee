import React from "react";
import { Route, Redirect } from "react-router-dom";
import { getRole } from "utils/auth.service";
import { ACCOUNT_TYPE } from "utils/consts";

function AdminRoute({ children, ...rest }) {
  return (
    <Route
      {...rest}
      render={() =>
        Number(getRole()) === ACCOUNT_TYPE.ADMIN ? (
          children
        ) : (
          <Redirect to="/" />
        )
      }
    />
  );
}

export default AdminRoute;
