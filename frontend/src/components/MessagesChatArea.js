import React from "react";
import { Avatar, Card, Col, Divider, Layout, Row, Input, Button } from "antd";
import Meta from "antd/lib/card/Meta";
import { SendOutlined, SettingOutlined } from "@ant-design/icons";

function MessagesChatArea({ history, activeMessageId }) {
  const { Content, Footer, Header } = Layout;
  const { TextArea } = Input;

  /*
    To do: Load user on opening. Read from mongo and also connect to socket.
  */

  let convo = [
    {
      from: "Josh",
      content: ["sup", "youre stupid", "hi baby"],
    },
    {
      from: "me",
      content: ["noooo", "don't say that", "how about we all goin on a trip"],
    },
    {
      from: "Josh",
      content: ["sup", "youre stupid", "hi baby"],
    },
    {
      from: "me",
      content: ["noooo", "don't say that", "how about we all goin on a trip"],
    },
    {
      from: "Josh",
      content: ["sup", "youre stupid", "hi baby"],
    },
    {
      from: "me",
      content: ["noooo", "don't say that", "how about we all goin on a trip"],
    },
    {
      from: "Josh",
      content: ["sup", "youre stupid", "hi baby"],
    },
    {
      from: "me",
      content: ["noooo", "don't say that", "how about we all goin on a trip"],
    },
    {
      from: "Josh",
      content: ["sup", "youre stupid", "hi baby"],
    },
    {
      from: "me",
      content: ["noooo", "don't say that", "how about we all goin on a trip"],
    },
  ];

  const sendMessage = (e) => {
    // add code to return message
  };

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
        {convo.map((block) => {
          return (
            <div
              className={`chatRight__items you-${
                block.from == "me" ? "sent" : "recieved"
              }`}
            >
              <div className="chatRight__inner" data-chat="person1">
                {block.from != "me" && (
                  <span>
                    <Avatar src="https://joeschmoe.io/api/v1/random" />{" "}
                  </span>
                )}

                <div className="convo">
                  {block.content.map((message) => {
                    return (
                      <div
                        className={`bubble-${
                          block.from == "me" ? "sent" : "recieved"
                        }`}
                      >
                        {message}
                      </div>
                    );
                  })}
                </div>
                {block.from == "me" && (
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

export default MessagesChatArea;
