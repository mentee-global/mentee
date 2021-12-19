import React, { useEffect, useState } from "react";
import { Avatar, Col, Divider, Layout, Row, Input, Button } from "antd";
import { withRouter } from "react-router-dom";

import Meta from "antd/lib/card/Meta";
import { SendOutlined } from "@ant-design/icons";
import useAuth from "utils/hooks/useAuth";
import { fetchAccountById } from "utils/api";

function MessagesChatArea(props) {
  const { Content, Footer, Header } = Layout;
  const { socket } = props;
  const { TextArea } = Input;

  const { profileId } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [accountData, setAccountData] = useState({});
  const { messages, activeMessageId, otherId, userType } = props;

  useEffect(() => {
    async function fetchAccount() {
      var account = await fetchAccountById(otherId, userType);
      if (account) {
        setAccountData(account);
      }
    }
    fetchAccount();
  }, [otherId]);

  /*
    To do: Load user on opening. Read from mongo and also connect to socket.
  */

  const sendMessage = (e) => {
    if (!messageText.replace(/\s/g, "").length) {
      return;
    }
    let today = new Date();
    let date =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
    let time =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date + " " + time;
    const msg = {
      body: messageText,
      message_read: false,
      sender_id: profileId,
      recipient_id: activeMessageId,
      time: dateTime,
    };
    socket.emit("send", msg);
    msg["sender_id"] = { $oid: msg["sender_id"] };
    msg["recipient_id"] = { $oid: msg["recipient_id"] };
    props.addMyMessage(msg);
    return;
  };

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
      {accountData ? (
        <Header className="chat-area-header">
          <Meta
            className=""
            avatar={<Avatar src={accountData.image?.url} />}
            title={accountData.name}
            description={accountData.professional_title}
          />
        </Header>
      ) : (
        <div></div>
      )}
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
                    <Avatar src={accountData.image?.url} />{" "}
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
