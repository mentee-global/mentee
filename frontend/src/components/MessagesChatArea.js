import React, { useEffect, useState, useRef } from "react";
import { Avatar, Col, Divider, Layout, Row, Input, Button, Spin } from "antd";
import { withRouter } from "react-router-dom";
import { ACCOUNT_TYPE } from "utils/consts";
import Meta from "antd/lib/card/Meta";
import { SendOutlined } from "@ant-design/icons";
import useAuth from "utils/hooks/useAuth";
import { fetchAccountById } from "utils/api";
import MenteeAppointmentModal from "./MenteeAppointmentModal";
import socketInvite from "utils/socket";
function MessagesChatArea(props) {
  const { Content, Header } = Layout;
  const { socket } = props;
  const { TextArea } = Input;
  const { profileId, isMentee, isMentor } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [accountData, setAccountData] = useState({});
  const [isAlreadyInvited, setIsAlreadyInvited] = useState(false);
  const [isAlreadyInvitedByMentor, setIsAlreadyInvitedByMentor] = useState(
    false
  );
  const [updateContent, setUpdateContent] = useState(false);
  const [isInviteSent, setIsInviteSent] = useState(false);
  const [currentMentor, setCurrentMentor] = useState("");
  const {
    messages,
    activeMessageId,
    otherId,
    userType,
    loading,
    isBookingVisible,
    inviteeId,
  } = props;
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
    async function fetchAccount() {
      var account = await fetchAccountById(otherId, userType);
      if (account) {
        setAccountData(account);
        if (parseInt(userType, 10) !== ACCOUNT_TYPE.MENTOR) {
          setIsAlreadyInvitedByMentor(
            account.favorite_mentors_ids.indexOf(otherId) >= 0
          );
        }
      }
      if (parseInt(userType, 10) === ACCOUNT_TYPE.MENTOR) {
        var profileAcount = await fetchAccountById(
          profileId,
          ACCOUNT_TYPE.MENTEE
        );
        if (profileAcount) {
          setIsAlreadyInvited(
            profileAcount.favorite_mentors_ids.indexOf(otherId) >= 0
          );
        }
      }
    }
    fetchAccount();
  }, [updateContent, otherId, messages]);
  useEffect(() => {
    scrollToBottom();
  }, [loading, messages]);

  const handleUpdateAccount = () => {
    setUpdateContent(!updateContent);
  };
  /*
    To do: Load user on opening. Read from mongo and also connect to socket.
  */

  const sendInvite = (e) => {
    const inviteMsg = {
      sender_id: profileId,
      recipient_id: activeMessageId,
    };
    setIsInviteSent(true);
    socketInvite.emit("invite", inviteMsg);
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
      body:
        "Pls check my calender under Booking Appointment to schdule a session.",
      message_read: false,
      sender_id: profileId,
      recipient_id: activeMessageId,
      time: dateTime,
    };
    socket.emit("send", msg);
    msg["sender_id"] = { $oid: msg["sender_id"] };
    msg["recipient_id"] = { $oid: msg["recipient_id"] };
    props.addMyMessage(msg);
    setMessageText("");
    return;
  };

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
    setMessageText("");
    return;
  };
  if (!activeMessageId || !messages || !messages.length) {
    return (
      <div className="no-messages">
        <div className="start-convo">Start a conversation today!</div>
      </div>
    );
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
            {((isBookingVisible && inviteeId === otherId) ||
              isAlreadyInvited) && (
              <div className="mentor-profile-book-appt-btn">
                <MenteeAppointmentModal
                  mentor_name={accountData.name}
                  availability={accountData.availability}
                  mentor_id={otherId}
                  mentee_id={profileId}
                  handleUpdateMentor={handleUpdateAccount}
                />
              </div>
            )}
            {isMentor && !isAlreadyInvitedByMentor && (
              <div>
                <Button
                  disabled={isInviteSent}
                  onClick={sendInvite}
                  type="default"
                  shape="round"
                  className="regular-button"
                >
                  Send invite
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div></div>
      )}
      <div className="conversation-content">
        <Spin spinning={loading}>
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
        </Spin>
        <div ref={messagesEndRef} />
      </div>
      <div className="conversation-footer">
        <TextArea
          className="message-input"
          placeholder="Send a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
        <Button
          id="sendMessagebtn"
          onClick={sendMessage}
          className="send-message-button"
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
export default withRouter(MessagesChatArea);
