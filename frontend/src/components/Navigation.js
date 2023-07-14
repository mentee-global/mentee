import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Layout } from "antd";
import usePersistedState from "utils/hooks/usePersistedState";
import { ACCOUNT_TYPE } from "utils/consts";
import { useAuth } from "utils/hooks/useAuth";

import "./css/Navigation.scss";
import NotFound from "./pages/NotFound";

const { Content } = Layout;

function Navigation(props) {
  const history = useHistory();
  const { onAuthStateChanged } = useAuth();

  useEffect(() => {
    onAuthStateChanged((user) => {
      if (!user && props.needsAuth) {
        history.push("/login");
      }
    });
  }, [history, props.needsAuth]);

  return (
    <Layout>
      <Content className="navigation-content">{props.content}</Content>
    </Layout>
  );
  {
    /* {isMentee && <MenteeMessageTab user_id={profileId} />} */
  }
}

export default Navigation;
