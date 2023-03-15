import React, { useEffect, useState } from "react";
import { withRouter } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import MessagesSidebar from "components/MessagesSidebar";
import { Layout, message } from "antd";
import MessagesChatArea from "components/MessagesChatArea";
import { getLatestMessages, getMessageData } from "utils/api";
import socket from "utils/socket";

import "../css/Messages.scss";
import { setActiveMessageId } from "features/messagesSlice";
import { updateNotificationsCount } from "features/notificationsSlice";

function Messages(props) {
  const { history } = props;
  const dispatch = useDispatch();
  const [latestConvos, setLatestConvos] = useState([]);
  const activeMessageId = useSelector(
    (state) => state.messages.activeMessageId
  );
  const [userType, setUserType] = useState();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBookingVisible, setBookingVisible] = useState(false);
  const [inviteeId, setinviteeId] = useState();
  const profileId = useSelector((state) => state.user.user?._id?.$oid);

  const messageListener = (data) => {
    async function fetchLatest() {
      const data = await getLatestMessages(profileId);
      setLatestConvos(data);
    }
    fetchLatest();
    if (data.allowBooking === "true") {
      setBookingVisible(true);
      setinviteeId(data.inviteeId);
    }
    if (data?.sender_id?.$oid === activeMessageId) {
      setMessages((prevMessages) => [...prevMessages, data]);
      dispatch(
        updateNotificationsCount({
          recipient: profileId,
          sender: data.sender_id.$oid,
        })
      );
    }
  };

  useEffect(() => {
    if (socket && profileId) {
      socket.on(profileId, messageListener);
      return () => {
        socket.off(profileId, messageListener);
      };
    }
  }, [socket, profileId, activeMessageId]);

  useEffect(() => {
    async function getData() {
      const data = await getLatestMessages(profileId);
      setLatestConvos(data);
      if (data?.length) {
        dispatch(
          updateNotificationsCount({
            recipient: profileId,
            sender: data[0].otherId,
          })
        );
        history.push(
          `/messages/${data[0].otherId}?user_type=${data[0].otherUser.user_type}`
        );
      } else {
        history.push("/messages/3");
      }
    }

    if (profileId) {
      getData();
    }
  }, [profileId]);

  useEffect(() => {
    var user_type = new URLSearchParams(props.location.search).get("user_type");
    dispatch(
      setActiveMessageId(props.match ? props.match.params.receiverId : null)
    );
    setUserType(user_type);
  });

  useEffect(() => {
    async function getData() {
      var user_type = new URLSearchParams(props.location.search).get(
        "user_type"
      );
      dispatch(
        setActiveMessageId(props.match ? props.match.params.receiverId : null)
      );
      setUserType(user_type);

      if (activeMessageId && profileId) {
        setLoading(true);
        setMessages(await getMessageData(profileId, activeMessageId));
        setLoading(false);
      }
    }
    getData();
  }, [activeMessageId]);

  // useEffect(() => {
  //   async function getData() {
  //     const data = await getMessageData(profileId, activeMessageId);
  //     setMessages(data);
  //   }

  //   if (profileId && activeMessageId) {
  //     getData();
  //   }
  // }, [profileId, activeMessageId]);

  const addMyMessage = (msg) => {
    setMessages((prevMessages) => [...prevMessages, msg]);
  };

  return (
    <Layout className="messages-container" style={{ backgroundColor: "white" }}>
      <MessagesSidebar
        latestConvos={latestConvos}
        activeMessageId={activeMessageId}
      />
      <Layout style={{ backgroundColor: "white" }}>
        <MessagesChatArea
          messages={messages}
          activeMessageId={activeMessageId}
          socket={socket}
          addMyMessage={addMyMessage}
          otherId={activeMessageId}
          userType={userType}
          loading={loading}
          isBookingVisible={isBookingVisible}
          inviteeId={inviteeId}
        />
      </Layout>
    </Layout>
  );
}

export default withRouter(Messages);
