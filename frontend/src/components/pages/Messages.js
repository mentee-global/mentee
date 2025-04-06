import React, { useEffect, useState, useCallback, useMemo } from "react";
import { withRouter } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import MessagesSidebar from "components/MessagesSidebar";
import { Layout, message } from "antd";
import MessagesChatArea from "components/MessagesChatArea";
import { getLatestMessages, getMessageData, fetchPartners } from "utils/api";
import socket from "utils/socket";

import "../css/Messages.scss";
import { setActiveMessageId } from "features/messagesSlice";
import { updateNotificationsCount } from "features/notificationsSlice";

function Messages(props) {
  const { history } = props;
  const dispatch = useDispatch();
  const [latestConvos, setLatestConvos] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const activeMessageId = useSelector(
    (state) => state.messages.activeMessageId
  );
  const [userType, setUserType] = useState();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBookingVisible, setBookingVisible] = useState(false);
  const [inviteeId, setinviteeId] = useState();
  const [restrictedPartners, setRestrictedPartners] = useState([]);
  const profileId = useSelector((state) => state.user.user?._id?.$oid);
  const user = useSelector((state) => state.user.user);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [messagesCache, setMessagesCache] = useState({});
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [currentPath, setCurrentPath] = useState(props.location.pathname);

  const messageListener = (data) => {
    async function fetchLatest() {
      setSidebarLoading(true);
      const { data, allMessages } = await getLatestMessages(profileId);
      console.log("getLatestMessages: ", data);
      setLatestConvos(data);
      setAllMessages(allMessages);
      setSidebarLoading(false);
    }
    fetchLatest();
    if (data.allowBooking === "true") {
      setBookingVisible(true);
      setinviteeId(data.inviteeId);
    }
    if (data?.sender_id?.$oid === activeMessageId) {
      setMessages((prevMessages) => [...prevMessages, data]);
      // Update cache when new message arrives
      setMessagesCache((prevCache) => ({
        ...prevCache,
        [activeMessageId]: [...(prevCache[activeMessageId] || []), data],
      }));
      dispatch(
        updateNotificationsCount({
          recipient: profileId,
          sender: data.sender_id.$oid,
        })
      );
    }
  };

  useEffect(() => {
    setCurrentPath(props.location.pathname);
  }, [props.location.pathname]);

  useEffect(() => {
    if (socket && profileId) {
      socket.on(profileId, messageListener);
      return () => {
        socket.off(profileId, messageListener);
      };
    }
  }, [socket, profileId, activeMessageId]);

  const loadConversation = useCallback(
    async (conversationId) => {
      if (!conversationId || !profileId) return;

      if (messagesCache[conversationId]) {
        setMessages(messagesCache[conversationId]);
        return;
      }

      setLoading(true);
      try {
        const messageData = await getMessageData(profileId, conversationId);
        console.log("getMessageData: ", messageData);
        setMessages(messageData || []);

        setMessagesCache((prevCache) => ({
          ...prevCache,
          [conversationId]: messageData || [],
        }));
      } catch (error) {
        console.error("Error loading conversation:", error);
      } finally {
        setLoading(false);
      }
    },
    [profileId, messagesCache]
  );

  // Memoized function to fetch data
  const fetchData = useCallback(async () => {
    if (!profileId || initialDataLoaded) return;

    setSidebarLoading(true);
    setLoading(true);

    try {
      // Fetch data in parallel
      const [messagesResponse, partnersResponse] = await Promise.all([
        getLatestMessages(profileId),
        fetchPartners(true, null),
      ]);
      console.log("getLatestMessages: ", messagesResponse);
      console.log("fetchPartners: ", partnersResponse);

      setLatestConvos(messagesResponse?.data || []);
      setAllMessages(messagesResponse?.allMessages || []);
      setRestrictedPartners(partnersResponse || []);
      setInitialDataLoaded(true);

      if (messagesResponse && messagesResponse?.data?.length) {
        const firstConversation = messagesResponse.data[0];

        dispatch(setActiveMessageId(firstConversation.otherId));
        loadConversation(firstConversation.otherId);

        let unread_message_senders = [];
        messagesResponse.data.forEach((message_item) => {
          if (
            message_item.message_read === false &&
            !unread_message_senders.includes(message_item.otherId)
          ) {
            unread_message_senders.push(message_item.otherId);
            dispatch(
              updateNotificationsCount({
                recipient: profileId,
                sender: message_item.otherId,
              })
            );
          }
        });

        if (
          props.location.pathname === "/messages" ||
          props.location.pathname === "/messages/"
        ) {
          if (props.location.pathname === currentPath) {
            history.replace(
              `/messages/${firstConversation.otherId}?user_type=${firstConversation.otherUser.user_type}`
            );
          }
        }
      } else {
        if (
          (props.location.pathname === "/messages" ||
            props.location.pathname === "/messages/") &&
          props.location.pathname === currentPath
        ) {
          history.replace("/messages/3");
        }
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      message.error("Failed to load messages.");
    } finally {
      setSidebarLoading(false);
      setLoading(false);
    }
  }, [
    profileId,
    initialDataLoaded,
    props.location.pathname,
    currentPath,
    history,
    dispatch,
    loadConversation,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!profileId) return;

    const receiverId = props.match?.params?.receiverId;
    const user_type = new URLSearchParams(props.location.search).get(
      "user_type"
    );

    const isUserType =
      receiverId && ["1", "2", "3", "4", "5"].includes(receiverId);

    if (receiverId && !isUserType) {
      dispatch(setActiveMessageId(receiverId));
      if (user_type) setUserType(user_type);
    } else if (isUserType && latestConvos.length > 0) {
      const firstConvo = latestConvos[0];
      dispatch(setActiveMessageId(firstConvo.otherId));
      setUserType(firstConvo.otherUser.user_type);

      const isStillOnMessagesPage =
        currentPath.startsWith("/messages") &&
        props.location.pathname.startsWith("/messages");
      if (isStillOnMessagesPage) {
        history.replace(
          `/messages/${firstConvo.otherId}?user_type=${firstConvo.otherUser.user_type}`
        );
      }
    }
  }, [
    props.location.search,
    props.match,
    profileId,
    dispatch,
    latestConvos,
    history,
    currentPath,
  ]);

  useEffect(() => {
    if (!props.location.pathname.startsWith("/messages")) return;

    const isStillOnMessagesPage = props.location.pathname === currentPath;
    if (!isStillOnMessagesPage) return;

    if (activeMessageId && profileId) {
      loadConversation(activeMessageId);
    } else {
      setMessages([]);
    }
  }, [
    activeMessageId,
    profileId,
    loadConversation,
    props.location.pathname,
    currentPath,
  ]);

  const addMyMessage = (msg) => {
    setMessages((prevMessages) => [...prevMessages, msg]);
    setAllMessages((prevMessages) => [...prevMessages, msg]);
    setMessagesCache((prevCache) => ({
      ...prevCache,
      [activeMessageId]: [...(prevCache[activeMessageId] || []), msg],
    }));

    setTimeout(() => {
      async function fetchLatest() {
        const { data } = await getLatestMessages(profileId);
        console.log("getLatestMessages: ", data);

        setLatestConvos(data);
      }
      fetchLatest();
    }, 500);
  };

  const sidebarData = useMemo(() => {
    return {
      latestConvos,
      activeMessageId,
      restrictedPartners,
      allMessages,
      user,
      loading: sidebarLoading,
    };
  }, [
    latestConvos,
    activeMessageId,
    restrictedPartners,
    allMessages,
    user,
    sidebarLoading,
  ]);

  return (
    <Layout className="messages-container" style={{ backgroundColor: "white" }}>
      <MessagesSidebar {...sidebarData} />
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
          restrictedPartners={restrictedPartners}
          user={user}
        />
      </Layout>
    </Layout>
  );
}

export default withRouter(Messages);
