import React, { useEffect, useState } from "react";
import { Avatar, Card, theme } from "antd";
import { useSelector, useDispatch } from "react-redux";
import Meta from "antd/lib/card/Meta";
import { updateNotificationsCount } from "features/notificationsSlice";
import { setActiveMessageId } from "features/messagesSlice";
import { useHistory } from "react-router";
import { fetchAccountById } from "utils/api";
import { ACCOUNT_TYPE } from "utils/consts";
import { useMediaQuery } from "react-responsive";
import { css } from "@emotion/css";

function MessageCard(props) {
  const { active } = props;
  const {
    token: {
      colorPrimaryBg,
      colorPrimaryBorder,
      colorBorderSecondary,
      colorPrimary,
    },
  } = theme.useToken();
  const history = useHistory();
  const dispatch = useDispatch();
  const thisUserId = useSelector((state) => state.user.user?._id?.$oid);
  const { latestMessage, otherName, otherId, otherUser } = props.chat;
  const [accountData, setAccountData] = useState({});
  const isMobile = useMediaQuery({ query: `(max-width: 761px)` });

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
      if (isMobile) {
        setTimeout(() => {
          var message_container = document.getElementsByClassName(
            "conversation-container"
          );
          if (message_container.length > 0) {
            message_container[0].style.display = "none";
          }
        }, 1000);
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

  const activeCardStyle = css`
    background: ${colorPrimaryBg};
    border: 1px solid ${colorPrimaryBorder};

    :hover {
      background: ${colorPrimaryBg};
    }
  `;
  return (
    <Card
      onClick={openMessage}
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

        ${active && activeCardStyle}
      `}
    >
      {accountData ? (
        <div
          className={
            active &&
            css`
              div {
                color: ${colorPrimary} !important;
              }
            `
          }
        >
          <Meta
            avatar={<Avatar src={accountData.image?.url} />}
            title={
              accountData.name ? accountData.name : accountData.organization
            }
            description={latestMessage.body}
          />
        </div>
      ) : null}
    </Card>
  );
}

export default MessageCard;
