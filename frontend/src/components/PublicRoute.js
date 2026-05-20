import React from "react";
import { Redirect, Route } from "react-router-dom";
import {
  getRole,
  getLoginPath,
  hasPendingOAuthRedirect,
  isSafeOAuthNext,
} from "utils/auth.service";
import { ACCOUNT_TYPE, REDIRECTS } from "utils/consts";

function PublicRoute({ children, ...rest }) {
  var role = getRole();
  var login_path = "";
  if (role === ACCOUNT_TYPE.HUB) {
    login_path = getLoginPath();
    if (!login_path) login_path = "";
  }
  var announcement_detail_flag = false;
  var oauth_flag = false;
  var path = rest.path;
  if (path.indexOf("/announcement/") > -1) {
    announcement_detail_flag = true;
  }
  if (path.indexOf("/oauth/") > -1) {
    oauth_flag = true;
  }

  // OAuth resume: a safe ?next=/oauth/... param means the user is mid-flow
  // from a sibling app that bounced through here because their Flask session
  // expired. Without this, a stale localStorage.role would redirect them to
  // their dashboard before LoginForm mounts, dropping the next= param.
  var oauth_next_flag = false;
  if (typeof window !== "undefined") {
    try {
      var nextParam = new URLSearchParams(window.location.search).get("next");
      oauth_next_flag = isSafeOAuthNext(nextParam);
    } catch (_) {
      oauth_next_flag = false;
    }
  }

  return (
    <Route
      {...rest}
      render={() =>
        role == null ||
        announcement_detail_flag ||
        oauth_flag ||
        oauth_next_flag ||
        hasPendingOAuthRedirect() ? (
          children
        ) : (
          <Redirect
            to={
              role === ACCOUNT_TYPE.HUB
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
