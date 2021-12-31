import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import socket from "utils/socket";
import { notificationIncrement } from "features/notificationsSlice";
import { setActiveMessageId } from "features/messagesSlice";

function SocketComponent() {
  const dispatch = useDispatch();
  const location = useLocation();
  const profileId = useSelector((state) => state.user.user?._id?.$oid);
  const activeMessageId = useSelector(
    (state) => state.messages.activeMessageId
  );

  // Creates an all catcher for any events and here it checks if a new
  // message is being sent and handles it
  useEffect(() => {
    if (socket) {
      socket.onAny((event, ...args) => {
        if (event === profileId) {
          const message = args[0];
          if (!message) return;
          if (message?.sender_id?.$oid !== activeMessageId) {
            dispatch(notificationIncrement());
          }
        }
      });
    }
    return () => {
      socket.offAny();
    };
  }, [profileId, activeMessageId]);

  useEffect(() => {
    dispatch(setActiveMessageId(null));
  }, [location]);
  return <div></div>;
}

export default SocketComponent;
