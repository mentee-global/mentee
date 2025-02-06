import React from "react";
import { withRouter } from "react-router-dom";
import LoginForm from "components/LoginForm";
function SupportLogin({ role, location }) {
  return (
    <>
      <LoginForm role={role} location={location} />
    </>
  );
}

export default withRouter(SupportLogin);
