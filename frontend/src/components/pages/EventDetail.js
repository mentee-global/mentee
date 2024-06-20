import React, { useEffect, useState } from "react";
import { UserOutlined } from "@ant-design/icons";
import { Avatar, Typography, Result } from "antd";
import { withRouter } from "react-router-dom";
import { useAuth } from "../../utils/hooks/useAuth";
import {
  fetchEventById,
  fetchMentors,
  fetchMentees,
  fetchPartners,
  fetchAccountById,
  fetchAccounts,
} from "utils/api";
import { useTranslation } from "react-i18next";
import { ACCOUNT_TYPE, formatDateTime } from "utils/consts";
import { useSelector } from "react-redux";

const { Title, Paragraph } = Typography;

function EventDetail({ match }) {
  const id = match.params.id;
  const [event, setEvent] = useState({});
  const [createUser, setCreateUser] = useState({});
  const { isHub, role } = useAuth();
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    async function getEvent(hub_user_id = null) {
      var all_users = [];
      const admin_data = await fetchAccounts(ACCOUNT_TYPE.ADMIN);
      if (isHub) {
        const partenr_data = await fetchPartners(undefined, hub_user_id);
        const hub_user = await fetchAccountById(hub_user_id, ACCOUNT_TYPE.HUB);
        all_users = [...partenr_data, hub_user, ...admin_data];
      } else {
        const mentor_data = await fetchMentors();
        const mentee_data = await fetchMentees();
        const partenr_data = await fetchPartners(undefined, null);
        all_users = [
          ...mentee_data,
          ...mentor_data,
          ...partenr_data,
          ...admin_data,
        ];
      }

      const EventData = await fetchEventById(id);
      if (EventData) {
        setEvent(EventData);
      }

      setTimeout(() => {
        const create_user = all_users.find(
          (x) => x._id.$oid === EventData.user_id.$oid
        );
        setCreateUser(create_user);
      }, 500);
    }
    var hub_user_id = null;
    if (isHub && user) {
      if (user.hub_id) {
        hub_user_id = user.hub_id;
      } else {
        hub_user_id = user._id.$oid;
      }
    }
    getEvent(hub_user_id);
  }, [id]);

  return (
    <>
      {event && !event.role.includes(role) ? (
        <Result
          status="403"
          title="403"
          subTitle={t("gallery.unauthorizedAccess")}
        />
      ) : (
        <div className="mentor-profile-flexbox">
          <div className={"mentor-profile-content-public"}>
            <div style={{ minWidth: "65%" }}>
              <div style={{ display: "flex" }}>
                <Avatar
                  size={120}
                  src={createUser && createUser.image && createUser.image.url}
                  icon={<UserOutlined />}
                />
                <div style={{ marginLeft: "20px" }}>
                  <Title className="gallery-title-text">
                    {event && event.title}
                  </Title>
                  <div className="gallery-header-description">
                    {t("events.eventsubmitby")} :{" "}
                    <span>
                      {createUser
                        ? createUser.name
                          ? createUser.name
                          : createUser.person_name
                        : "Admin User"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="datetime-area" style={{ marginTop: "20px" }}>
                {event.start_datetime && (
                  <>
                    <label
                      style={{
                        fontSize: "20px",
                        fontWeight: 600,
                        marginRight: "10px",
                      }}
                    >
                      {t("events.period")} :{" "}
                    </label>
                    <span style={{ fontSize: "20px", color: "#800020" }}>
                      {formatDateTime(new Date(event.start_datetime.$date))} ~{" "}
                    </span>
                    {event.end_datetime && (
                      <span style={{ fontSize: "20px", color: "#800020" }}>
                        {formatDateTime(new Date(event.end_datetime.$date))}
                      </span>
                    )}
                  </>
                )}

                {event.image_file && (
                  <Typography>
                    <Paragraph
                      style={{
                        fontSize: "20px",
                        fontWeight: 600,
                        marginTop: "5px",
                        marginBottom: "5px",
                      }}
                    >
                      {t("events.attatchment")}:
                    </Paragraph>
                    <img
                      style={{
                        marginLeft: "5%",
                        marginTop: "15px",
                        width: "60%",
                      }}
                      className="event-img"
                      src={event.image_file.url}
                      alt=""
                    />
                  </Typography>
                )}
                {event.description && (
                  <Typography>
                    <Paragraph
                      style={{
                        fontSize: "20px",
                        fontWeight: 600,
                        marginTop: "5px",
                        marginBottom: "5px",
                      }}
                    >
                      {t("events.summary")}:
                    </Paragraph>
                    <Paragraph
                      style={{
                        fontSize: "16px",
                        paddingLeft: "10px",
                        marginTop: "5px",
                        marginBottom: "5px",
                      }}
                    >
                      {event.description}
                    </Paragraph>
                  </Typography>
                )}
                <div style={{ marginTop: "15px" }}>
                  {event.url && (
                    <>
                      <Typography>
                        <Paragraph
                          style={{
                            fontSize: "20px",
                            fontWeight: 600,
                            marginTop: "5px",
                            marginBottom: "5px",
                          }}
                        >
                          {"URL"}:
                        </Paragraph>
                        <Paragraph
                          style={{
                            fontSize: "16px",
                            paddingLeft: "10px",
                            marginTop: "5px",
                            marginBottom: "5px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "65%",
                          }}
                        >
                          <a style={{ whiteSpace: "nowrap" }} href={event.url}>
                            {event.url}
                          </a>
                        </Paragraph>
                      </Typography>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withRouter(EventDetail);
