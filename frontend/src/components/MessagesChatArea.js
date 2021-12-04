import React, { useEffect, useState } from "react";
import { Avatar, Card, Col, Divider, Layout, Row, Input, Button, message } from "antd";
import { withRouter } from "react-router-dom";

import Meta from "antd/lib/card/Meta";
import { SendOutlined, SettingOutlined } from "@ant-design/icons";
// import { getMessageData } from "utils/dummyData";
import useAuth from "utils/hooks/useAuth";
import { getMessageData } from "utils/api";

function MessagesChatArea(props) {
  const { Content, Footer, Header } = Layout;
  const {socket} = props;
  const { TextArea } = Input;
  
  const { profileId } = useAuth();
  const [messageText, setMessageText] = useState("");

  // const [messages, setMessages] = useState([]);



  

  // console.log(profileId)

  /*
    To do: Load user on opening. Read from mongo and also connect to socket.
  */

  const sendMessage = (e) => {
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date+' '+time;
    socket.emit("send", {
      body: messageText,
      message_read: false,
      sender_id: profileId,
      recipient_id: activeMessageId,
      time: dateTime
    });
    console.log("sent")
  };

  const {messages, activeMessageId} = props;

  // console.log(messages);
  // console.log(activeMessageId);
  if (!activeMessageId || !messages || !messages.length) {
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
                block.sender_id.$oid == profileId ? "sent" : "recieved"
              }`}
            >
              <div className="chatRight__inner" data-chat="person1">
                {block.sender_id.$oid != profileId && (
                  <span>
                    <Avatar src="https://joeschmoe.io/api/v1/random" />{" "}
                  </span>
                )}

                <div className="convo">
                  <div
                    className={`bubble-${
                      block.sender_id.$oid == profileId ? "sent" : "recieved"
                    }`}
                  >
                    {block.body}
                  </div>
                </div>
                {block.sender_id.$oid == profileId && (
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
              onChange={(e) => setMessageText(e.target.value)}
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
