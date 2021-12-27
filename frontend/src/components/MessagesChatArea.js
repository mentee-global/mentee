import React, { useEffect, useState } from "react";
import { Avatar, Col, Divider, Layout, Row, Input, Button } from "antd";
import { withRouter } from "react-router-dom";

import Meta from "antd/lib/card/Meta";
import { SendOutlined } from "@ant-design/icons";
import useAuth from "utils/hooks/useAuth";
import { fetchAccountById } from "utils/api";

function MessagesChatArea(props) {
  const { Content, Header } = Layout;
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
    return (
        <h1>No Messages</h1>
    )
  }

  const OldHeader = () => (
    <Header className="chat-area-header">
      <Meta
        className=""
        avatar={<Avatar src={accountData.image?.url} />}
        title={accountData.name}
        description={accountData.professional_title}
      />
    </Header>
  );

  return (
    <div className="conversation-container">
      {accountData ? (
        <div className="messages-chat-area-header">
          <Avatar size={60} src={accountData.image?.url} />
          <div className="messages-chat-area-header-info">
            <div className="messages-chat-area-header-name">
              {accountData.name}
            </div>
            <div className="messages-chat-area-header-title">
              {accountData.professional_title}
            </div>
          </div>
        </div>
      ) : (
        <div></div>
      )}
      <div className="conversation-content">
        {messages.map((block) => {
          return (
            <div
              className={`chatRight__items you-${
                block.sender_id.$oid == profileId ? "sent" : "received"
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
                      block.sender_id.$oid == profileId ? "sent" : "received"
                    }`}
                  >
                    {block.body}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="conversation-footer">
        <TextArea
          className="message-input"
          placeholder="Send a message..."
          onChange={(e) => setMessageText(e.target.value)}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
        <Button
          onClick={sendMessage}
          className="send-message-button"
          shape="circle"
          type="primary"
          icon={<SendOutlined rotate={315} />}
          size={48}
        />
      </div>
    </div>
  );
}

export default withRouter(MessagesChatArea);
