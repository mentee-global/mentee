import React, { useEffect, useState } from "react";
import { Avatar, Card } from "antd";
import { useSelector, useDispatch } from "react-redux";
import Meta from "antd/lib/card/Meta";
import { updateNotificationsCount } from "features/notificationsSlice";
import { setActiveMessageId } from "features/messagesSlice";
import { useHistory } from "react-router";
import { fetchAccountById } from "utils/api";
import { ACCOUNT_TYPE } from "utils/consts";
import { useMediaQuery } from "react-responsive";

function MessageCard(props) {
  const history = useHistory();
  const dispatch = useDispatch();
  const thisUserId = useSelector((state) => state.user.user?._id?.$oid);
  const { latestMessage, otherName, otherId, otherUser } = props.chat;
  const [accountData, setAccountData] = useState({});
  const name = `message-${props.active ? "active-" : ""}card`;
  const isMobile = useMediaQuery({ query: `(max-width: 600px)` });

  const openMessage = () => {
    dispatch(
      updateNotificationsCount({ recipient: thisUserId, sender: otherId })
    );
    dispatch(setActiveMessageId({ activeMessageId: thisUserId }));
    history.push(`/messages/${otherId}?user_type=${otherUser.user_type}`);
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

  useEffect(() => {
    async function fetchAccount() {
      var otherType = otherUser.user_type;
      var account = await fetchAccountById(otherId, otherType);
      if (account) {
        setAccountData(account);
      } else {
        account = await fetchAccountById(otherId, ACCOUNT_TYPE.MENTEE);
        setAccountData(account);
      }
    }
    fetchAccount();
    if (isMobile) {
      setTimeout(() => {
        var message_container = document.getElementsByClassName(
          "conversation-container"
        );
        if (message_container.length > 0) {
          message_container[0].style.display = "none";
        }
      }, 500);
    }
  }, []);

  return (
    <Card onClick={openMessage} className={name}>
      {accountData ? (
        <div>
          <Meta
            avatar={<Avatar src={accountData.image?.url} />}
            title={<div className="message-card-title">{accountData.name}</div>}
            description={
              <div className="message-card-description">
                {latestMessage.body}
              </div>
            }
            style={{ color: "white" }}
          />
        </div>
      ) : null}
    </Card>
  );
}

export default MessageCard;
