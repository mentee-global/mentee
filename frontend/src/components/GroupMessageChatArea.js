import React, { useEffect, useState, useRef } from "react";
import { Avatar, Input, Button, Spin, theme, Tooltip } from "antd";
import { withRouter, NavLink } from "react-router-dom";
import moment from "moment-timezone";
import { SendOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useAuth } from "utils/hooks/useAuth";
import { sendNotifyUnreadMessage } from "utils/api";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "react-responsive";
import { css } from "@emotion/css";
import { ACCOUNT_TYPE } from "utils/consts";

function GroupMessageChatArea(props) {
  const {
    token: { colorPrimaryBg, colorPrimary },
  } = theme.useToken();
  const { t } = useTranslation();
  const { socket } = props;
  const { TextArea } = Input;
  const { profileId, isPartner } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [accountData, setAccountData] = useState(null);

  const isMobile = useMediaQuery({ query: `(max-width: 761px)` });

  const { messages, loading, hub_user_id, particiants } = props;
  const messagesEndRef = useRef(null);
  const buttonRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current != null) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [loading, messages]);
  /*
    To do: Load user on opening. Read from mongo and also connect to socket.
  */

  const showSideBar = () => {
    if (isMobile) {
      var sidebar = document.getElementsByClassName("ant-layout-sider");
      if (sidebar.length > 0) {
        sidebar[0].style.display = "block";
      }
    }
  };

  const linkify = (text) => {
    const urlPattern =
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    return text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
  };

  const sendMessage = (e) => {
    let currentMessage = messageText;
    if (!currentMessage.trim().length) {
      return;
    }
    let dateTime = moment().utc();
    const msg = {
      body: currentMessage,
      message_read: false,
      sender_id: profileId,
      hub_user_id: hub_user_id,
      time: dateTime,
    };
    socket.emit("sendGroup", msg);
    setTimeout(() => {
      particiants.map((particiant_user) => {
        if (particiant_user._id.$oid != profileId) {
          sendNotifyUnreadMessage(particiant_user._id.$oid);
        }
      });
    }, 1000);
    msg["sender_id"] = { $oid: msg["sender_id"] };
    msg["hub_user_id"] = { $oid: msg["hub_user_id"] };
    msg.time = moment().local().format("LLL");
    props.addMyMessage(msg);
    setMessageText("");
    return;
  };
  //   if (!activeMessageId || !messages || !messages.length) {
  //     return (
  //       <div className="no-messages">
  //         {isMobile && (
  //           <div
  //             onClick={showSideBar}
  //             style={{ cursor: "pointer", width: "20px", fontSize: "16px" }}
  //           >
  //             <ArrowLeftOutlined />
  //           </div>
  //         )}
  //         <div className="start-convo">{t("messages.startConversation")}</div>
  //       </div>
  //     );
  //   }

  const styles = {
    bubbleSent: css`
      float: right;
      clear: right;
      background-color: ${colorPrimaryBg};
    `,
    bubbleReceived: css`
      float: left;
      clear: left;
      background-color: #f4f5f9;
    `,
  };

  const HtmlContent = ({ content }) => {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };

  return (
    <div className="conversation-container">
      {accountData ? (
        <div className="messages-chat-area-header">
          {isMobile && (
            <div
              onClick={showSideBar}
              style={{ cursor: "pointer", width: "20px", fontSize: "16px" }}
            >
              <ArrowLeftOutlined />
            </div>
          )}
          <Avatar size={60} src={accountData.image?.url} />
          <div className="messages-chat-area-header-info">
            <div className="messages-chat-area-header-name">
              {isPartner ? accountData.organization : accountData.name}
            </div>
            <div className="messages-chat-area-header-title">
              {isPartner ? accountData.intro : accountData.professional_title}
            </div>
          </div>
        </div>
      ) : (
        <div></div>
      )}
      <div className="conversation-content group-conversation-content">
        <Spin spinning={loading}>
          {messages &&
            messages.map((block) => {
              var sender_user = particiants.find(
                (x) => x._id.$oid == block.sender_id.$oid
              );
              return (
                <div
                  className={`chatRight__items you-${
                    block.sender_id.$oid === profileId ? "sent" : "received"
                  }`}
                >
                  <div
                    className={`chatRight__inner  message-area ${
                      block.sender_id.$oid !== profileId
                        ? "flex-start"
                        : "flex-end"
                    }`}
                    data-chat="person1"
                  >
                    <div className="flex">
                      {block.sender_id.$oid !== profileId && sender_user && (
                        <span>
                          <NavLink
                            to={`/gallery/${
                              sender_user.hub_user_id
                                ? ACCOUNT_TYPE.PARTNER
                                : ACCOUNT_TYPE.HUB
                            }/${block.sender_id.$oid}`}
                          >
                            <div style={{ width: "50px", textAlign: "center" }}>
                              <Avatar
                                src={sender_user?.image?.url}
                                style={{ cursor: "pointer" }}
                              />
                            </div>
                            <div
                              style={{
                                cursor: "pointer",
                                fontSize: "11px",
                                textAlign: "left",
                                width: "50px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {sender_user.name
                                ? sender_user.name
                                : sender_user.organization}
                            </div>
                          </NavLink>
                        </span>
                      )}
                      <div className="convo">
                        <div
                          className={css`
                            padding: 5px 15px;
                            border-radius: 5px;
                            margin-left: 8px;
                            width: fit-content;
                            white-space: pre-wrap;
                            ${block.sender_id.$oid === profileId
                              ? styles.bubbleSent
                              : styles.bubbleReceived}
                          `}
                        >
                          <HtmlContent content={linkify(block.body)} />
                        </div>
                      </div>
                    </div>

                    <span style={{ opacity: "40%" }}>
                      {block.time
                        ? block.time
                        : moment
                            .utc(block.created_at.$date)
                            .local()
                            .format("LLL")}
                    </span>
                  </div>
                </div>
              );
            })}
        </Spin>
        <div ref={messagesEndRef} />
      </div>
      <div className="conversation-footer">
        <TextArea
          className="message-input"
          placeholder={t("messages.sendMessagePlaceholder")}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
        <Button
          id="sendMessagebtn"
          onClick={sendMessage}
          className={css`
            margin-left: 0.5em;
          `}
          shape="circle"
          type="primary"
          ref={buttonRef}
          icon={<SendOutlined rotate={315} />}
          size={48}
        />
      </div>
    </div>
  );
}
export default withRouter(GroupMessageChatArea);
