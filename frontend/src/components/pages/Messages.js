import React, { useState } from "react";
import { withRouter } from "react-router-dom";
import "../css/Messages.scss";
import useAuth from "../../utils/hooks/useAuth";
import { MENTEE_GALLERY_PAGE, MENTOR_GALLERY_PAGE } from "../../utils/consts";
import MessagesSidebar from "components/MessagesSidebar";
import { Layout } from "antd";
import MessagesChatArea from "components/MessagesChatArea";

function Messages(props) {
  const { history } = props;
  const { isMentor } = useAuth();
  console.log(props.match);

  return (
    <Layout className="messages-container" style={{ backgroundColor: "white" }}>
      <MessagesSidebar />

      <Layout
        className="messages-subcontainer"
        style={{ backgroundColor: "white" }}
      >
        <MessagesChatArea />
      </Layout>
    </Layout>
  );
}

export default withRouter(Messages);
