import React from "react";
import { Divider, Layout } from "antd";

function MessagesChatArea({ history }) {
  const { Content } = Layout;

  return (
    <Content className="messages-chat-area">
      <Divider
        className="chat-area-divider"
        orientation="left"
        type="vertical"
      ></Divider>
      hello
    </Content>
  );
}

export default MessagesChatArea;
