import React, { useEffect, useState, useRef } from "react";
import { Avatar, Input, Button, Spin, theme, Dropdown } from "antd";
import { withRouter, NavLink } from "react-router-dom";
import moment from "moment-timezone";
import { SendOutlined } from "@ant-design/icons";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "utils/hooks/useAuth";
import { sendNotifyUnreadMessage } from "utils/api";
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";
import { ACCOUNT_TYPE } from "utils/consts";

function GroupMessageChatArea(props) {
  const {
    token: { colorPrimaryBg },
  } = theme.useToken();
  const { t } = useTranslation();
  const { socket } = props;
  const { TextArea } = Input;
  const { profileId } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [replyMessageText, setReplyMessageText] = useState("");

  const { messages, loading, hub_user_id, particiants } = props;
  const messagesEndRef = useRef(null);
  const buttonRef = useRef(null);
  const [dotMenuFlags, setDotMenuFlags] = useState({});
  const [replyInputFlags, setReplyInputFlags] = useState({});
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);

  const scrollToBottom = () => {
    if (messagesEndRef.current != null) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };
  function sortParentChild(items) {
    const map = new Map();

    // Populate map with each item by id for quick access
    items.forEach((item) =>
      map.set(item._id ? item._id.$oid : null, { ...item, children: [] })
    );

    const sortedArray = [];

    // Loop through items and place them under their parent
    items.forEach((item) => {
      if (item.parent_message_id) {
        const parent = map.get(item.parent_message_id);
        if (parent) {
          if (item._id) {
            parent.children.push(map.get(item._id.$oid));
          } else {
            parent.children.push(item);
          }
        }
      } else {
        sortedArray.push(map.get(item._id?.$oid ?? null));
      }
    });

    return sortedArray;
  }
  useEffect(() => {
    scrollToBottom();
    let temp = {};
    let tmep_inputs = {};
    if (messages && messages.length > 0) {
      messages.map((message_item) => {
        if (message_item._id && message_item._id.$oid) {
          temp[message_item._id.$oid] = false;
          tmep_inputs[message_item._id.$oid] = false;
        }
      });
      setDotMenuFlags(temp);
      setReplyInputFlags(tmep_inputs);
      setRefreshFlag(!refreshFlag);
    }
  }, [loading, messages]);
  /*
    To do: Load user on opening. Read from mongo and also connect to socket.
  */
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
      parent_message_id: null,
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

  const sendReplyMessage = (block_id) => {
    let currentMessage = replyMessageText;
    if (!currentMessage.trim().length) {
      let temp = replyInputFlags;
      temp[block_id] = false;
      setReplyInputFlags(temp);
      setRefreshFlag(!refreshFlag);
      return;
    }
    let dateTime = moment().utc();
    const msg = {
      body: currentMessage,
      message_read: false,
      sender_id: profileId,
      hub_user_id: hub_user_id,
      parent_message_id: block_id,
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
    msg["parent_message_id"] = block_id;
    msg.time = moment().local().format("LLL");
    props.addMyMessage(msg);
    let temp = replyInputFlags;
    temp[block_id] = false;
    setReplyInputFlags(temp);
    return;
  };

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

  const changeDropdown = (block_id) => {
    let temp = dotMenuFlags;
    temp[block_id] = !temp[block_id];
    setDotMenuFlags(temp);
    setRefreshFlag(!refreshFlag);
  };

  const getDropdownMenuItems = (block) => {
    const items = [];
    items.push({
      key: "reply",
      label: (
        <span
          onClick={() => {
            let temp = replyInputFlags;
            Object.keys(temp).forEach((key) => {
              temp[key] = false;
            });
            temp[block._id.$oid] = true;
            setReplyInputFlags(temp);
            let dot_temp = dotMenuFlags;
            dot_temp[block._id.$oid] = false;
            setDotMenuFlags(dot_temp);
            setRefreshFlag(!refreshFlag);
            setReplyMessageText("");
          }}
        >
          {t("messages.reply")}
        </span>
      ),
    });
    return items;
  };

  const HtmlContent = ({ content }) => {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };

  const onEmojiClick = (event, kind = "main") => {
    if (kind === "main") {
      setMessageText((messageText) => messageText + event.emoji);
    } else {
      setReplyMessageText((replyMessageText) => replyMessageText + event.emoji);
    }
    setShowEmojiPicker(false); // Hide picker after selection
    setShowReplyEmojiPicker(false);
  };

  const renderMessages = (data, depth = 0) => {
    return data.map((block) => {
      let sender_user = particiants.find(
        (x) => x._id.$oid === block.sender_id.$oid
      );
      return (
        <>
          <div
            style={{ marginLeft: 50 * depth + "px" }}
            className={`chatRight__items you-${
              block.sender_id.$oid === profileId && depth === 0
                ? "sent"
                : "received"
            }`}
          >
            <div
              className={`chatRight__inner  message-area ${
                block.sender_id.$oid !== profileId || depth !== 0
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
                {block.sender_id.$oid !== profileId && sender_user && (
                  <div>
                    <Dropdown
                      menu={{
                        items: getDropdownMenuItems(block),
                      }}
                      onOpenChange={() => changeDropdown(block._id.$oid)}
                      open={dotMenuFlags[block._id.$oid]}
                      placement="bottom"
                    >
                      <div style={{ paddingLeft: "10px", cursor: "pointer" }}>
                        ⋮
                      </div>
                    </Dropdown>
                  </div>
                )}
              </div>

              <span style={{ opacity: "40%" }}>
                {block.time
                  ? block.time
                  : moment.utc(block.created_at.$date).local().format("LLL")}
              </span>
              {block.sender_id.$oid !== profileId &&
                sender_user &&
                replyInputFlags[block._id.$oid] && (
                  <div className="reply-message-container">
                    <TextArea
                      className="reply-message-textarea"
                      value={replyMessageText}
                      onChange={(e) => setReplyMessageText(e.target.value)}
                      autoSize={{ minRows: 1, maxRows: 3 }}
                    />
                    <img
                      alt=""
                      className="emoji-icon"
                      src="https://icons.getbootstrap.com/assets/icons/emoji-smile.svg"
                      onClick={() => setShowEmojiPicker((val) => !val)}
                    />
                    {showEmojiPicker && (
                      <div className="emoji-container">
                        <EmojiPicker
                          onEmojiClick={(e) => onEmojiClick(e, "reply")}
                        />
                      </div>
                    )}
                    <Button
                      onClick={() => sendReplyMessage(block._id.$oid)}
                      className="reply-message-send-button"
                      shape="circle"
                      type="primary"
                      icon={<SendOutlined rotate={315} />}
                      size={32}
                    />
                  </div>
                )}
            </div>
          </div>
          {block.children && block.children.length > 0 && (
            <>{renderMessages(block.children, depth + 1)}</>
          )}
        </>
      );
    });
  };

  return (
    <div className="conversation-container">
      <div className="conversation-content group-conversation-content">
        <Spin spinning={loading}>
          {messages && renderMessages(sortParentChild(messages))}
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
        <img
          alt=""
          className="emoji-icon"
          src="https://icons.getbootstrap.com/assets/icons/emoji-smile.svg"
          onClick={() => setShowReplyEmojiPicker((val) => !val)}
        />
        {showReplyEmojiPicker && (
          <div className="emoji-container">
            <EmojiPicker onEmojiClick={(e) => onEmojiClick(e, "main")} />
          </div>
        )}
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
