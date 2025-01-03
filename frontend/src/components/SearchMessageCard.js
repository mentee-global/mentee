import { css } from "@emotion/css";
import { Avatar, Card, Tabs, theme } from "antd";
import Meta from "antd/es/card/Meta";
import TabPane from "antd/es/tabs/TabPane";
import { setActiveMessageId } from "features/messagesSlice";
import { updateNotificationsCount } from "features/notificationsSlice";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMediaQuery } from "react-responsive";
import { useHistory } from "react-router";
import MessageCard from "./MessageCard";

const SearchMessageCard = ({ messages, searchQuery, side_data, activeMessageId }) => {
  const [activeTab, setActiveTab] = useState("message");
  const {
    token: { colorPrimaryBorder, colorBorderSecondary },
  } = theme.useToken();
  const history = useHistory();
  const dispatch = useDispatch();
  const thisUserId = useSelector((state) => state.user.user?._id?.$oid);
  const isMobile = useMediaQuery({ query: `(max-width: 761px)` });

  const findUserInfo = (id) => {
    const user = side_data.find((item) => item.otherId === id);

    return user;
  };

  const filteredMessages = searchQuery
    ? messages.filter((message) =>
        message.body.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} style={{ backgroundColor: "yellow" }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const openMessage = (message) => {
    dispatch(
      updateNotificationsCount({
        recipient: thisUserId,
        sender: message.recipient_id?.$oid,
      })
    );
    dispatch(setActiveMessageId({ activeMessageId: thisUserId }));
    history.push(
      `/messages/${message.recipient_id?.$oid}?user_type=${
        findUserInfo(message.recipient_id?.$oid)?.otherUser?.user_type
      }&message_id=${message._id?.$oid}`
    );
    if (isMobile) {
      var sidebar = document.getElementsByClassName("ant-layout-sider");
      if (sidebar.length > 0) {
        sidebar[0].style.display = "none";
      }
      var message_container = document.getElementsByClassName(
        "conversation-container"
      );
      if (message_container.length > 0) {
        message_container[0].style.display = "flex";
      }
    }
  };

  const descriptionClass = css`
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 100%;
    display: block;
  `;

  return (
    <Tabs centered activeKey={activeTab} onChange={setActiveTab}>
      <TabPane tab="User" key="user">
        {side_data.map((chat) => {
          if (
            chat.otherUser.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          )
            return (
              <MessageCard key={chat.otherId} chat={chat} active={chat.otherId === activeMessageId} />
            );
        })}
      </TabPane>
      <TabPane tab="Message" key="message">
        {filteredMessages.map((message) => {
          const userInfo = findUserInfo(message.recipient_id?.$oid)?.otherUser;
          return (
            <Card
              key={message.id}
              onClick={() => openMessage(message)}
              className={css`
                width: 90%;
                margin-left: auto;
                margin-right: auto;
                margin-bottom: 3%;
                border: 1px solid "#e8e8e8";
                box-sizing: border-box;
                border-radius: 7px;

                :hover {
                  background-color: ${colorBorderSecondary};
                  border-color: ${colorPrimaryBorder};
                  cursor: pointer;
                  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
                }
              `}
            >
              <div>
                <Meta
                  avatar={<Avatar src={userInfo?.image} />}
                  title={
                    userInfo?.name ? userInfo?.name : userInfo?.organization
                  }
                  description={
                    <span className={descriptionClass}>
                      {highlightText(message.body, searchQuery)}
                    </span>
                  }
                />
              </div>
            </Card>
          );
        })}
      </TabPane>
    </Tabs>
  );
};

export default SearchMessageCard;
