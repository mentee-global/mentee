import React, { useEffect, useState } from "react";
import { Avatar, Card } from "antd";
import { useSelector, useDispatch } from "react-redux";
import Meta from "antd/lib/card/Meta";
import { updateNotificationsCount } from "features/notifications/notificationsSlice";
import { useHistory } from "react-router";
import { fetchAccountById } from "utils/api";
import { ACCOUNT_TYPE } from "utils/consts";

function MessageCard(props) {
  const history = useHistory();
  const dispatch = useDispatch();
  const thisUserId = useSelector((state) => state.user.user._id.$oid);
  const { latestMessage, otherName, otherId, otherUser } = props.chat;
  const [accountData, setAccountData] = useState({});
  const name = `message-${props.active ? "active-" : ""}card`;

  const openMessage = () => {
    dispatch(
      updateNotificationsCount({ recipient: thisUserId, sender: otherId })
    );
    history.push(`/messages/${otherId}?user_type=${otherUser.user_type}`);
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
