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
  // Add cache state for messages
  const [messagesCache, setMessagesCache] = useState({});
  // Add state to track if initial data has been loaded
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const messageListener = (data) => {
    async function fetchLatest() {
      setSidebarLoading(true);
      const { data, allMessages } = await getLatestMessages(profileId);
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
      setMessagesCache(prevCache => ({
        ...prevCache,
        [activeMessageId]: [...(prevCache[activeMessageId] || []), data]
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
    if (socket && profileId) {
      socket.on(profileId, messageListener);
      return () => {
        socket.off(profileId, messageListener);
      };
    }
  }, [socket, profileId, activeMessageId]);

  // Memoized function to fetch data
  const fetchData = useCallback(async () => {
    if (!profileId || initialDataLoaded) return;
    
    setSidebarLoading(true);
    setLoading(true);
    
    try {
      // Fetch data in parallel
      const [messagesResponse, partnersResponse] = await Promise.all([
        getLatestMessages(profileId),
        fetchPartners(true, null)
      ]);
      
      setLatestConvos(messagesResponse?.data || []);
      setAllMessages(messagesResponse?.allMessages || []);
      setRestrictedPartners(partnersResponse || []);
      setInitialDataLoaded(true);
      
      if (messagesResponse && messagesResponse?.data?.length) {
        let unread_message_senders = [];
        messagesResponse?.data.forEach((message_item) => {
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

        // Only redirect if the user is still on the messages page
        const currentPath = props.location.pathname;
        if (currentPath === "/messages" || currentPath === "/messages/") {
          history.push(
            `/messages/${messagesResponse?.data[0].otherId}?user_type=${messagesResponse?.data[0].otherUser.user_type}`
          );
        }
      } else {
        // Only redirect if the user is still on the messages page
        const currentPath = props.location.pathname;
        if (currentPath === "/messages" || currentPath === "/messages/") {
          history.push("/messages/3");
        }
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setSidebarLoading(false);
      setLoading(false);
    }
  }, [profileId, initialDataLoaded, props.location.pathname, history, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    var user_type = new URLSearchParams(props.location.search).get("user_type");
    dispatch(
      setActiveMessageId(props.match ? props.match.params.receiverId : null)
    );
    setUserType(user_type);
  }, [props.location.search, props.match, dispatch]);

  // Optimized message loading with caching
  useEffect(() => {
    async function getMessageDetails() {
      if (!activeMessageId || !profileId) return;
      
      // Check if we already have these messages in cache
      if (messagesCache[activeMessageId]) {
        setMessages(messagesCache[activeMessageId]);
        return;
      }
      
      setLoading(true);
      try {
        const messageData = await getMessageData(profileId, activeMessageId);
        setMessages(messageData || []);
        
        // Cache the fetched messages
        setMessagesCache(prevCache => ({
          ...prevCache,
          [activeMessageId]: messageData || []
        }));
      } catch (error) {
        console.error("Error fetching message details:", error);
      } finally {
        setLoading(false);
      }
    }
    
    getMessageDetails();
  }, [activeMessageId, profileId, messagesCache]);

  const addMyMessage = (msg) => {
    setMessages((prevMessages) => [...prevMessages, msg]);
    setAllMessages((prevMessages) => [...prevMessages, msg]);
    
    // Update cache when sending a new message
    setMessagesCache(prevCache => ({
      ...prevCache,
      [activeMessageId]: [...(prevCache[activeMessageId] || []), msg]
    }));
    
    // Debounce the sidebar refresh to avoid unnecessary API calls
    setTimeout(() => {
      async function fetchLatest() {
        const { data } = await getLatestMessages(profileId);
        setLatestConvos(data);
      }
      fetchLatest();
    }, 500);
  };

  // Memoize sidebar data to avoid unnecessary re-renders
  const sidebarData = useMemo(() => {
    return {
      latestConvos,
      activeMessageId,
      restrictedPartners,
      allMessages,
      user,
      loading: sidebarLoading
    };
  }, [latestConvos, activeMessageId, restrictedPartners, allMessages, user, sidebarLoading]);

  return (
    <Layout className="messages-container" style={{ backgroundColor: "white" }}>
      <MessagesSidebar
        {...sidebarData}
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
          restrictedPartners={restrictedPartners}
          user={user}
        />
      </Layout>
    </Layout>
  );
}

export default withRouter(Messages);
