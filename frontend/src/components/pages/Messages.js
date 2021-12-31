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
  const profileId = useSelector((state) => state.user.user?._id?.$oid);

  // TODO: Fix this so that it doesn't add a new chat if one already exists
  const messageListener = (data) => {
    if (data?.sender_id?.$oid == activeMessageId) {
      setMessages((prevMessages) => [...prevMessages, data]);
      dispatch(
        updateNotificationsCount({
          recipient: profileId,
          sender: data.sender_id.$oid,
        })
      );
    } else {
      // const messageCard = {
      //   latestMessage: data,
      //   otherUser: {
      //     name: data?.sender_id?.$oid,
      //     image:
      //       "https://image.shutterstock.com/image-vector/fake-stamp-vector-grunge-rubber-260nw-1049845097.jpg",
      //   },
      //   otherId: data?.sender_id?.$oid,
      //   new: true, // use to indicate new message card UI
      // };

      async function fetchLatest() {
        const data = await getLatestMessages(profileId);
        setLatestConvos(data);
      }
      fetchLatest();
    }
  };

  useEffect(() => {
    if (socket && profileId) {
      socket.on(profileId, messageListener);
      return () => {
        socket.off(profileId, messageListener);
      };
    }
  }, [socket, profileId]);

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
        history.push("/messages/1");
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
        />
      </Layout>
    </Layout>
  );
}

export default withRouter(Messages);
