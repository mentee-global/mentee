import React, { useEffect, useState } from "react";
import { withRouter } from "react-router-dom";
import "../css/Messages.scss";
import useAuth from "../../utils/hooks/useAuth";
import { BASE_URL } from "utils/consts";
import MessagesSidebar from "components/MessagesSidebar";
import { Layout } from "antd";
import MessagesChatArea from "components/MessagesChatArea";
import { getLatestMessages, getMessageData } from "utils/api";
import { io } from "socket.io-client";
import usePersistedState from "utils/hooks/usePersistedState";


function Messages(props) {
  const { history } = props;
  const [latestConvos, setLatestConvos] = useState([]);
  const [activeMessageId, setActiveMessageId] = useState("");
  const [userType, setUserType] = useState();
  const [messages, setMessages] = useState([]);
  const { profileId } = useAuth();

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (profileId && messages?.length) {
      if (socket === null) {
        setSocket(io(BASE_URL));
      }

      if (socket) {
        socket.on(profileId, (data) => {
          if (data?.sender_id?.$oid == activeMessageId) {
            setMessages([...messages, data]);
          } else {
            const messageCard = {
              latestMessage: data,
              otherUser: {
                name: data?.sender_id?.$oid,
                image:
                  "https://image.shutterstock.com/image-vector/fake-stamp-vector-grunge-rubber-260nw-1049845097.jpg",
              },
              otherId: data?.sender_id?.$oid,
              new: true, // use to indicate new message card UI
            };
            setLatestConvos([messageCard, ...latestConvos]);
          }
        });
      }
    }
  }, [messages, profileId, socket]);

  useEffect(() => {
    async function getData() {
      const data = await getLatestMessages(profileId);
      setLatestConvos(data);
      if (data?.length) {
        history.push(`/messages/${data[0].otherId}?user_type=${data[0].otherUser.user_type}`);
      } else {
        history.push("/messages/1");
      }
      
    }

    if (profileId) {
      getData();
    }
  }, [profileId]);

  useEffect(() => {
    var user_type = new URLSearchParams(props.location.search).get("user_type")
    setActiveMessageId(props.match ? props.match.params.receiverId : null);
    setUserType(user_type);
  });

  useEffect(() => {
    var user_type = new URLSearchParams(props.location.search).get("user_type")
    setActiveMessageId(props.match ? props.match.params.receiverId : null);
    setUserType(user_type);
    if (activeMessageId && profileId) {
      setMessages(getMessageData(profileId, activeMessageId));
    }
  }, [props.location]);

  useEffect(() => {
    async function getData() {
      const data = await getMessageData(profileId, activeMessageId);
      setMessages(data);
    }

    if (profileId && activeMessageId) {
      getData();
    }
  }, [profileId, activeMessageId]);

  const addMyMessage = (msg) => {
    setMessages([...messages, msg]);
  };

  return (
    <Layout className="messages-container" style={{ backgroundColor: "white" }}>
      <MessagesSidebar latestConvos={latestConvos} />
      <Layout
        className="messages-subcontainer"
        style={{ backgroundColor: "white" }}
      >
        <MessagesChatArea
          messages={messages}
          activeMessageId={activeMessageId}
          socket={socket}
          addMyMessage={addMyMessage}
          otherId={activeMessageId}
          userType={userType}
        />
      </Layout>
    </Layout>
  );
}

export default withRouter(Messages);
