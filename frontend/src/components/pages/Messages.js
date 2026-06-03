import React, { useEffect, useState, useRef } from "react";
import { withRouter } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import MessagesSidebar from "components/MessagesSidebar";
import { Layout } from "antd";
import MessagesChatArea from "components/MessagesChatArea";
import {
  getLatestMessages,
  getMessageData,
  getDirectMessagesPage,
  fetchPartners,
} from "utils/api";
import socket from "utils/socket";
import { getProfileId } from "utils/auth.service";

import "../css/Messages.scss";
import { setActiveMessageId } from "features/messagesSlice";
import { updateNotificationsCount } from "features/notificationsSlice";

// How many messages to load per page when scrolling up through a thread.
const THREAD_PAGE_SIZE = 30;
const asArray = (value) => (Array.isArray(value) ? value : []);
const objectId = (value) => value?.$oid || value;

function Messages(props) {
  const { history } = props;
  const dispatch = useDispatch();
  const [latestConvos, setLatestConvos] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [paused, setPaused] = useState(false);
  const activeMessageId = useSelector(
    (state) => state.messages.activeMessageId
  );
  const [userType, setUserType] = useState();
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [beforeCursor, setBeforeCursor] = useState(null);
  // Always-current activeMessageId so async fetches can detect a conversation
  // switch and avoid writing one thread's messages into another.
  const activeMessageIdRef = useRef(activeMessageId);
  activeMessageIdRef.current = activeMessageId;
  const [loading, setLoading] = useState(false);
  const [isBookingVisible, setBookingVisible] = useState(false);
  const [inviteeId, setinviteeId] = useState();
  const [restrictedPartners, setRestrictedPartners] = useState([]);
  // Fall back to the stored profile id so the sidebar can load on a hard
  // reload before redux finishes hydrating the user (otherwise getLatestMessages
  // short-circuits on an undefined id and the conversation list shows empty).
  const reduxProfileId = useSelector((state) => state.user.user?._id?.$oid);
  const profileId = reduxProfileId || getProfileId();
  const user = useSelector((state) => state.user.user);
  const [sidebarLoading, setSidebarLoading] = useState(false);

  const messageListener = (data) => {
    async function fetchLatest() {
      setSidebarLoading(true);
      const result = await getLatestMessages(profileId);
      setLatestConvos(asArray(result?.data));
      setAllMessages(asArray(result?.allMessages));
      setSidebarLoading(false);
    }
    fetchLatest();
    if (data?.allowBooking === "true") {
      setBookingVisible(true);
      setinviteeId(data.inviteeId);
    }
    const senderId = objectId(data?.sender_id);
    if (senderId === activeMessageId) {
      setPaused(data.paused_flag);
      setMessages((prevMessages) => [...prevMessages, data]);
      dispatch(
        updateNotificationsCount({
          recipient: profileId,
          sender: senderId,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, profileId, activeMessageId]);

  useEffect(() => {
    async function getData() {
      setSidebarLoading(true);
      const data = await getLatestMessages(profileId);
      const restricted_partners = await fetchPartners(true, null);
      const latest = asArray(data?.data);
      setLatestConvos(latest);
      setAllMessages(asArray(data?.allMessages));
      setRestrictedPartners(asArray(restricted_partners));
      // Only auto-open the first contact when the URL doesn't already point at a
      // specific conversation. Otherwise a refresh (or deep-link) on one thread
      // would bounce the user to the first contact instead of staying put.
      const currentReceiver = props.match?.params?.receiverId;
      const hasValidReceiver = currentReceiver && currentReceiver.length > 3;
      if (latest.length) {
        let unread_message_senders = [];
        latest.forEach((message_item) => {
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
          window.location.pathname.includes("/messages/") &&
          !hasValidReceiver
        ) {
          history.push(
            `/messages/${data?.data[0].otherId}?user_type=${data?.data[0].otherUser.user_type}`
          );
        }
      } else {
        if (window.location.pathname.includes("/messages/")) {
          history.push("/messages/3");
        }
      }
      setSidebarLoading(false);
    }

    if (profileId) {
      getData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const deepLinkMessageId = new URLSearchParams(props.location.search).get(
        "message_id"
      );
      dispatch(
        setActiveMessageId(props.match ? props.match.params.receiverId : null)
      );
      setUserType(user_type);

      if (activeMessageId && profileId && activeMessageId.length > 3) {
        const convo = activeMessageId;
        setLoading(true);
        try {
          if (deepLinkMessageId) {
            // Deep-link from search: load the whole thread so the target message
            // is present in the DOM and can be scrolled to.
            const full = await getMessageData(profileId, activeMessageId);
            if (activeMessageIdRef.current !== convo) return;
            setMessages(asArray(full));
            setHasMore(false);
            setBeforeCursor(null);
          } else {
            const {
              messages: page,
              hasMore: more,
              nextBefore,
              nextBeforeId,
            } = await getDirectMessagesPage(profileId, activeMessageId, {
              limit: THREAD_PAGE_SIZE,
            });
            if (activeMessageIdRef.current !== convo) return;
            setMessages(asArray(page));
            setHasMore(more);
            setBeforeCursor(
              nextBefore && nextBeforeId
                ? { before: nextBefore, beforeId: nextBeforeId }
                : null
            );
          }
        } finally {
          if (activeMessageIdRef.current === convo) {
            setLoading(false);
          }
        }
      }
    }
    getData();
    // profileId is included so the thread still loads on a full page refresh,
    // where the Firebase-derived profileId resolves after activeMessageId is set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMessageId, profileId]);

  const addMyMessage = (msg) => {
    setMessages((prevMessages) => [...prevMessages, msg]);
    setAllMessages((prevMessages) => [...prevMessages, msg]);
    setTimeout(() => {
      async function fetchLatest() {
        const result = await getLatestMessages(profileId);
        setLatestConvos(asArray(result?.data));
      }
      fetchLatest();
    }, 500);
  };

  // Fetch the next older page when the user scrolls to the top of a thread and
  // prepend it. The keyset cursor is exclusive so pages don't overlap; the _id
  // de-dupe is just defense-in-depth.
  const loadOlderMessages = async () => {
    if (!hasMore || loadingOlder || !beforeCursor) return;
    const convo = activeMessageId;
    setLoadingOlder(true);
    try {
      const result = await getDirectMessagesPage(profileId, activeMessageId, {
        limit: THREAD_PAGE_SIZE,
        before: beforeCursor.before,
        beforeId: beforeCursor.beforeId,
      });
      // Drop the result if the user switched conversations mid-fetch.
      if (activeMessageIdRef.current !== convo) return;
      // On a transient failure, leave the cursor and hasMore intact so the user
      // can retry by scrolling up again, rather than permanently stranding
      // older history behind a false "end of history".
      if (result.error) return;
      const {
        messages: older,
        hasMore: more,
        nextBefore,
        nextBeforeId,
      } = result;
      setMessages((prev) => {
        const existingIds = new Set(
          prev.map((m) => m?._id?.$oid).filter(Boolean)
        );
        const deduped = asArray(older).filter(
          (m) => !existingIds.has(m?._id?.$oid)
        );
        if (deduped.length === 0) return prev;
        return [...deduped, ...prev];
      });
      setHasMore(more);
      setBeforeCursor(
        nextBefore && nextBeforeId
          ? { before: nextBefore, beforeId: nextBeforeId }
          : null
      );
    } finally {
      setLoadingOlder(false);
    }
  };

  // BUG: If we swap between breakpoints of mobile/desktop, the sidebar will not update
  // This is because the sidebar is not a child of the layout, so it does not get re-rendered
  // when the layout changes
  return (
    <Layout className="messages-container" style={{ backgroundColor: "white" }}>
      <MessagesSidebar
        latestConvos={latestConvos}
        activeMessageId={activeMessageId}
        restrictedPartners={restrictedPartners}
        allMessages={allMessages}
        user={user}
        loading={sidebarLoading}
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
          paused={paused}
          hasMore={hasMore}
          loadingOlder={loadingOlder}
          loadOlderMessages={loadOlderMessages}
        />
      </Layout>
    </Layout>
  );
}

export default withRouter(Messages);
