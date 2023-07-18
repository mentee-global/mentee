import React, { useState, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { ACCOUNT_TYPE } from "utils/consts";
import LoginForm from "components/LoginForm";
function AdminLogin() {
  return (
    <>
      <LoginForm role={ACCOUNT_TYPE.ADMIN} />
    </>
  );
}

export default withRouter(AdminLogin);
