import React, { useState } from "react";
import { withRouter } from "react-router-dom";
import "../css/Messages.scss";
import useAuth from "../../utils/hooks/useAuth";
import { MENTEE_GALLERY_PAGE, MENTOR_GALLERY_PAGE } from "../../utils/consts";
import MessagesSidebar from "components/MessagesSidebar";
import { Layout } from "antd";
import MessagesChatArea from "components/MessagesChatArea";

function Messages({ history }) {
  const { isMentor } = useAuth();


  return (
    <Layout className="messages-container">
      <Layout className="messages-subcontainer">
        <MessagesSidebar />
        <MessagesChatArea />
      </Layout>
    </Layout>
  );
}

export default withRouter(Messages);
