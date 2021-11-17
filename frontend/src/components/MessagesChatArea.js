import React, { useEffect, useState } from "react";
import { Avatar, Card, Col, Divider, Layout, Row, Input, Button, message } from "antd";
import { withRouter } from "react-router-dom";

import Meta from "antd/lib/card/Meta";
import { SendOutlined, SettingOutlined } from "@ant-design/icons";
import { getMessageData } from "utils/dummyData";
import useAuth from "utils/hooks/useAuth";

function MessagesChatArea(props) {
  const { Content, Footer, Header } = Layout;
  const { TextArea } = Input;
  const { profileId } = useAuth();
  const [activeMessageId, setActiveMessageId] = useState("");

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!messages.length && activeMessageId && profileId) {
      setMessages(getMessageData(profileId, activeMessageId));
    }
  });

  useEffect(() => {
    setActiveMessageId(props.match ? props.match.params.receiverId : null);
    if (activeMessageId && profileId) {
      setMessages(getMessageData(profileId, activeMessageId));
    }
  }, [props.location]);

  console.log(profileId)

  /*
    To do: Load user on opening. Read from mongo and also connect to socket.
  */

  const sendMessage = (e) => {
    // add code to return message
  };

  console.log(messages);
  console.log(activeMessageId);
  if (!messages.length) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Divider
        className="chat-area-divider"
        orientation="left"
        type="vertical"
      />
      <Header className="chat-area-header">
        <Meta
          className=""
          avatar={<Avatar src="https://joeschmoe.io/api/v1/random" />}
          title="Nikhil Goat"
          description="Professional model and product designer."
        />
      </Header>
      <Content className="conversation-box">
        {messages.map((block) => {
          return (
            <div
              className={`chatRight__items you-${
                block.sender_id == profileId ? "sent" : "recieved"
              }`}
            >
              <div className="chatRight__inner" data-chat="person1">
                {block.sender_id != profileId && (
                  <span>
                    <Avatar src="https://joeschmoe.io/api/v1/random" />{" "}
                  </span>
                )}

                <div className="convo">
                  <div
                    className={`bubble-${
                      block.sender_id == profileId ? "sent" : "recieved"
                    }`}
                  >
                    {block.body}
                  </div>
                </div>
                {block.sender_id == profileId && (
                  <span>
                    <Avatar src="https://joeschmoe.io/api/v1/random" />{" "}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </Content>
      <Footer style={{ backgroundColor: "white" }}>
        <Row type="flex" align="middle">
          <Col flex="auto">
            <TextArea
              className="message-input"
              placeholder="Send a message..."
              autoSize={{ minRows: 1, maxRows: 3 }}
            />
          </Col>
          <Col flex="100px">
            <Button
              onClick={sendMessage}
              className="send-message-button"
              type="primary"
              icon={<SendOutlined />}
              size="large"
            >
              Send
            </Button>
          </Col>
        </Row>
      </Footer>
    </>
  );
}

export default withRouter(MessagesChatArea);
