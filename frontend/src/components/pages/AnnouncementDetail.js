import React, { useEffect, useState } from "react";
import { Typography, notification } from "antd";
import { withRouter } from "react-router-dom";
import { useAuth } from "../../utils/hooks/useAuth";
import { getAnnounceDoc, getAnnounceById, downloadBlob } from "utils/api";
import { useTranslation } from "react-i18next";
import { I18N_LANGUAGES } from "utils/consts";
import { useSelector } from "react-redux";
import AdminDownloadDropdown from "../AdminDownloadDropdown";

const { Title, Paragraph } = Typography;

function AnnouncementDetail({ match }) {
  const id = match.params.id;
  const [announce, setAnnounce] = useState({});
  const { isHub } = useAuth();
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    async function getData(hub_user_id = null) {
      const data = await getAnnounceById(id);
      if (data) {
        setAnnounce(data);
      }
    }
    var hub_user_id = null;
    if (isHub && user) {
      if (user.hub_id) {
        hub_user_id = user.hub_id;
      } else {
        hub_user_id = user._id.$oid;
      }
    }
    getData(hub_user_id);
  }, [id]);

  const getAvailableLangs = (record) => {
    if (!record?.translations) return [I18N_LANGUAGES[0]];
    let items = I18N_LANGUAGES.filter((lang) => {
      return (
        Object.keys(record?.translations).includes(lang.value) &&
        record?.translations[lang.value] !== null
      );
    });
    // Appends English by default
    items.unshift(I18N_LANGUAGES[0]);
    return items;
  };

  const handleAnnounceDownload = async (record, lang) => {
    let response = await getAnnounceDoc(record._id.$oid, lang);
    if (!response) {
      notification.error({
        message: "ERROR",
        description: "Couldn't download file",
      });
      return;
    }
    downloadBlob(response, record.file_name);
  };

  return (
    <>
      <div className="mentor-profile-flexbox">
        <div className={"mentor-profile-content-public"}>
          <div style={{ minWidth: "65%" }}>
            <div style={{ display: "flex" }}>
              <div style={{}}>
                <Title className="gallery-title-text">
                  {announce && announce.name}
                </Title>
              </div>
            </div>

            <div className="datetime-area" style={{ marginTop: "20px" }}>
              {announce.image && (
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
                    src={announce.image.url}
                    alt=""
                  />
                </Typography>
              )}
              {announce.description && (
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
                    {announce.description}
                  </Paragraph>
                </Typography>
              )}
              <div style={{ marginTop: "15px" }}>
                {announce.file_name && (
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
                        {"File"}:
                      </Paragraph>
                      <Paragraph
                        style={{
                          fontSize: "16px",
                          paddingLeft: "10px",
                          marginTop: "5px",
                          marginBottom: "5px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <AdminDownloadDropdown
                          options={getAvailableLangs(announce)}
                          title={announce.file_name}
                          onClick={(lang) =>
                            handleAnnounceDownload(announce, lang)
                          }
                        />
                      </Paragraph>
                    </Typography>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default withRouter(AnnouncementDetail);
