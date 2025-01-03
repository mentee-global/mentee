import React, { useState } from "react";
import { withRouter } from "react-router-dom";

import { Divider, Input, Layout, Spin } from "antd";
import MessageCard from "./MessageCard";
import { useTranslation } from "react-i18next";
import { SearchOutlined } from "@ant-design/icons";
import { css } from "@emotion/css";
import SearchMessageCard from "./SearchMessageCard";

function MessagesSidebar(props) {
  const { t } = useTranslation();
  const { Sider } = Layout;
  const [searchQuery, setSearchQuery] = useState("");
  const { latestConvos, activeMessageId, restrictedPartners, user } = props;
  var side_data = [];
  if (user && user.pair_partner && user.pair_partner.restricted) {
    if (latestConvos && latestConvos.length > 0) {
      if (
        user.pair_partner.assign_mentees &&
        user.pair_partner.assign_mentees.length > 0
      ) {
        user.pair_partner.assign_mentees.map((item) => {
          var record = latestConvos.find((x) => x.otherId === item.id);
          if (record !== undefined && record !== null) {
            side_data.push(record);
          }
          return false;
        });
        user.pair_partner.assign_mentors.map((item) => {
          var record = latestConvos.find((x) => x.otherId === item.id);
          if (record !== undefined && record !== null) {
            side_data.push(record);
          }
          return false;
        });
      }
      if (
        user.pair_partner.assign_mentors &&
        user.pair_partner.assign_mentors.length
      ) {
      }
    }
  } else {
    if (restrictedPartners && restrictedPartners.length > 0) {
      var restricted_user_ids = [];
      restrictedPartners?.map((partner_item) => {
        if (partner_item.assign_mentors) {
          partner_item.assign_mentors.map((assign_item) => {
            restricted_user_ids.push(assign_item.id);
            return false;
          });
        }
        if (partner_item.assign_mentees) {
          partner_item.assign_mentees.map((assign_item) => {
            restricted_user_ids.push(assign_item.id);
            return false;
          });
        }
        return false;
      });
      latestConvos?.map((item) => {
        if (!restricted_user_ids.includes(item.otherId)) {
          side_data.push(item);
        }
        return false;
      });
    } else {
      side_data = latestConvos;
    }
  }
  return (
    <Sider
      style={{ background: "white" }}
      width={400}
      className="messages-sidebar-background"
    >
      <Spin
        wrapperClassName={css`
          width: 100%;
        `}
        spinning={props.loading}
      >
        <div className="messages-sidebar-header">
          <h1>{t("messages.sidebarTitle")}</h1>
        </div>
        <div
          className={css`
            padding: 0 20px;
            margin-bottom: 10px;
          `}
        >
          <Input
            placeholder={t("messages.search")}
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Divider className="header-divider" orientation="left"></Divider>
        <div className="messages-sidebar" style={{ paddingTop: "1em" }}>
          {searchQuery && (
            <SearchMessageCard
              activeMessageId={activeMessageId}
              messages={props?.allMessages}
              searchQuery={searchQuery}
              side_data={side_data}
            />
          )}
          {!searchQuery &&
            side_data &&
            side_data.length > 0 &&
            side_data.map((chat) => {
              if (
                chat.otherUser.name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
              ) {
                if (chat.otherId === activeMessageId) {
                  return (
                    <MessageCard key={chat.otherId} chat={chat} active={true} />
                  );
                } else {
                  return (
                    <MessageCard
                      key={chat.otherId}
                      chat={chat}
                      active={false}
                    />
                  );
                }
              } else {
                return <></>;
              }
            })}
        </div>
      </Spin>
    </Sider>
  );
}

export default withRouter(MessagesSidebar);
