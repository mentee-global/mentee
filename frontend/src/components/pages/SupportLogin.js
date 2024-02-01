import React from "react";
import { withRouter } from "react-router-dom";
import { ACCOUNT_TYPE } from "utils/consts";
import LoginForm from "components/LoginForm";
function SupportLogin() {
  return (
    <>
      <LoginForm role={ACCOUNT_TYPE.SUPPORT} />
    </>
  );
}

export default withRouter(SupportLogin);
