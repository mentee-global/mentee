import React, { useEffect, useState } from "react";
import { withRouter } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import { Layout } from "antd";
import GroupMessageChatArea from "components/GroupMessageChatArea";
import {
  getGroupMessageData,
  fetchPartners,
  fetchAccountById,
} from "utils/api";
import socket from "utils/socket";

import "../css/Messages.scss";
import { setActiveMessageId } from "features/messagesSlice";
import { updateNotificationsCount } from "features/notificationsSlice";
import { getRole } from "utils/auth.service";
import { ACCOUNT_TYPE } from "utils/consts";

function GroupMessages(props) {
  const dispatch = useDispatch();
  const activeMessageId = useSelector(
    (state) => state.messages.activeMessageId
  );
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [particiants, setParticiants] = useState([]);
  const profileId = useSelector((state) => state.user.user?._id?.$oid);
  const user = useSelector((state) => state.user.user);
  const role = getRole();
  var hub_user_id = null;
  if (role == ACCOUNT_TYPE.HUB && user) {
    if (user.hub_id) {
      hub_user_id = user.hub_id;
    } else {
      hub_user_id = user._id.$oid;
    }
  }

  const editMessageListner = (data) => {
    if (hub_user_id) {
      if (
        data?.hub_user_id?.$oid === activeMessageId &&
        data?.sender_id?.$oid !== profileId
      ) {
        var temp = messages;
        temp = temp.map((item) =>
          item._id.$oid === data._id.$oid ? data : item
        );
        setMessages(temp);
      }
    } else {
      if (data?.sender_id?.$oid !== profileId) {
        temp = messages;
        temp = temp.map((item) =>
          item._id.$oid === data._id.$oid ? data : item
        );
        setMessages(temp);
      }
    }
  };

  const messageListener = (data) => {
    if (hub_user_id) {
      if (
        data?.hub_user_id?.$oid === activeMessageId &&
        data?.sender_id?.$oid !== profileId
      ) {
        setMessages((prevMessages) => [...prevMessages, data]);
        dispatch(
          updateNotificationsCount({
            recipient: profileId,
            sender: data.sender_id.$oid,
          })
        );
      }
    } else {
      if (data?.sender_id?.$oid !== profileId) {
        setMessages((prevMessages) => [...prevMessages, data]);
        dispatch(
          updateNotificationsCount({
            recipient: profileId,
            sender: data.sender_id.$oid,
          })
        );
      }
    }
  };

  useEffect(() => {
    async function getParticiants(hub_user_id) {
      var temp = [];
      let Partner_data = [];
      if (hub_user_id) {
        Partner_data = await fetchPartners(undefined, hub_user_id);
      } else {
        Partner_data = await fetchPartners();
      }

      if (Partner_data) {
        temp = Partner_data;
      }

      if (hub_user_id) {
        const hub_user = await fetchAccountById(hub_user_id, ACCOUNT_TYPE.HUB);
        if (hub_user) {
          temp.push(hub_user);
        }
      }
      setParticiants(temp);
    }
    getParticiants(hub_user_id);
  }, [hub_user_id]);

  useEffect(() => {
    if (socket) {
      if (hub_user_id) {
        socket.on(hub_user_id, messageListener);
        socket.on(hub_user_id + "-edited", editMessageListner);
        return () => {
          socket.off(hub_user_id, messageListener);
          socket.off(hub_user_id + "-edited", editMessageListner);
        };
      } else {
        socket.on("group-partner", messageListener);
        socket.on("group-partner-edited", editMessageListner);
        return () => {
          socket.off("group-partner", messageListener);
          socket.off("group-partner-edited", editMessageListner);
        };
      }
    }
  }, [socket, hub_user_id, profileId, activeMessageId]);

  useEffect(() => {
    dispatch(
      setActiveMessageId(
        props.match
          ? props.match.params.hub_user_id
            ? props.match.params.hub_user_id
            : props.match.params.receiverId
          : null
      )
    );
  });

  useEffect(() => {
    async function getData(hub_user_id) {
      dispatch(
        setActiveMessageId(
          props.match
            ? props.match.params.hub_user_id
              ? props.match.params.hub_user_id
              : props.match.params.receiverId
            : null
        )
      );
      if (profileId) {
        setLoading(true);
        setMessages(await getGroupMessageData(hub_user_id));
        setLoading(false);
      }
    }
    getData(hub_user_id);
  }, [activeMessageId]);

  const editMessage = (msg, block_id) => {
    var temp = messages;
    temp = temp.map((item) => (item._id.$oid === block_id ? msg : item));
    setMessages(temp);
  };

  const addMyMessage = (msg) => {
    setMessages((prevMessages) => [...prevMessages, msg]);
  };

  // BUG: If we swap between breakpoints of mobile/desktop, the sidebar will not update
  // This is because the sidebar is not a child of the layout, so it does not get re-rendered
  // when the layout changes
  return (
    <Layout className="messages-container" style={{ backgroundColor: "white" }}>
      <Layout style={{ backgroundColor: "white" }}>
        <GroupMessageChatArea
          messages={messages}
          socket={socket}
          addMyMessage={addMyMessage}
          editMessage={editMessage}
          loading={loading}
          user={user}
          particiants={particiants}
          hub_user_id={hub_user_id}
        />
      </Layout>
    </Layout>
  );
}

export default withRouter(GroupMessages);
