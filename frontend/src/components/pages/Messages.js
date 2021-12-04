import React, { useEffect, useState } from "react";
import { withRouter } from "react-router-dom";
import "../css/Messages.scss";
import useAuth from "../../utils/hooks/useAuth";
import { MENTEE_GALLERY_PAGE, MENTOR_GALLERY_PAGE } from "../../utils/consts";
import MessagesSidebar from "components/MessagesSidebar";
import { Layout } from "antd";
import MessagesChatArea from "components/MessagesChatArea";
import { getLatestMessages, getMessageData } from "utils/api";
import { io } from "socket.io-client";

function Messages(props) {
  const { history } = props;
  const [latestConvos, setLatestConvos] = useState([]);
  const [activeMessageId, setActiveMessageId] = useState("");
  const [messages, setMessages] = useState([]);

  const URL = "http://localhost:5000";

  console.log(props.match);

  const { profileId } = useAuth();

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(URL);
    setSocket(newSocket);
    return () => newSocket.close();
  }, [setSocket]);

  useEffect(() => {
    async function getData() {
      const data = await getLatestMessages(profileId);
      console.log(data);
      setLatestConvos(data);
      history.push(`/messages/${data[0].otherId}`);
    }

    if (profileId) {
      getData();
    }
  }, [profileId]);

  useEffect(() => {
    setActiveMessageId(props.match ? props.match.params.receiverId : null);
  });

  useEffect(() => {
    setActiveMessageId(props.match ? props.match.params.receiverId : null);
    if (activeMessageId && profileId) {
      setMessages(getMessageData(profileId, activeMessageId));
    }
  }, [props.location]);

  useEffect(() => {
    async function getData() {
      const data = await getMessageData(profileId, activeMessageId);
      console.log(data);
      setMessages(data);
    }

    if (profileId && activeMessageId) {
      getData();
    }
  }, [profileId, activeMessageId]);

  if (profileId) {
    console.log("listening to ... " + profileId);
    socket.once(profileId, (data) => {
      console.log(data);
    });
  }

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
        />
      </Layout>
    </Layout>
  );
}

export default withRouter(Messages);
