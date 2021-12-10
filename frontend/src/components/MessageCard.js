import { Avatar, Card } from "antd";
import Meta from "antd/lib/card/Meta";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { fetchAccountById } from "utils/api";
import { ACCOUNT_TYPE } from "utils/consts";

function MessageCard(props) {
  const history = useHistory();
  const { latestMessage, otherName, otherId, otherUser } = props.chat;
  const [accountData, setAccountData] = useState({});

  const openMessage = () => {
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

  const name = `message-${props.active ? "active-" : ""}card`;
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
