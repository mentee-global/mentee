import React, { useState, useEffect } from "react";
import { getAnnouncements, getAnnounceDoc, downloadBlob } from "utils/api";
import {
  Input,
  Modal,
  Spin,
  theme,
  Typography,
  Affix,
  Button,
  FloatButton,
  Tooltip,
  notification,
} from "antd";
import { NavLink } from "react-router-dom";
import { SearchOutlined } from "@ant-design/icons";
import "../css/Gallery.scss";
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";
import { ACCOUNT_TYPE, I18N_LANGUAGES } from "utils/consts";
import { useSelector } from "react-redux";
import { getRole } from "utils/auth.service";
import AdminDownloadDropdown from "../AdminDownloadDropdown";
import Item from "antd/es/list/Item";

const { Title, Paragraph } = Typography;
const styles = {
  title: {
    fontSize: "2em",
    whiteSpace: "normal",
    overflow: "visible",
    textOverflow: "ellipsis",
    margin: 0,
  },
  subTitle: {
    fontSize: "1.5em px",
    whiteSpace: "normal",
    overflow: "visible",
    textOverflow: "ellipsis",
    margin: 0,
  },
  icon: {
    fontSize: "20px",
    paddingRight: "7px",
  },
};

function Announcements() {
  const {
    token: { colorPrimary, colorPrimaryBg },
  } = theme.useToken();
  const { t } = useTranslation();
  const [allData, setAllData] = useState([]);
  const [query, setQuery] = useState();
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [hubUrl, setHubUrl] = useState("");
  const { user } = useSelector((state) => state.user);
  const role = getRole();
  useEffect(() => {
    async function getData(hub_user_id) {
      const all_data = await getAnnouncements(
        role,
        user?._id.$oid,
        hub_user_id
      );
      setAllData(all_data);
      setPageLoaded(true);
    }
    var hub_user_id = null;
    if (role == ACCOUNT_TYPE.HUB && user) {
      if (user.hub_id) {
        hub_user_id = user.hub_id;
        if (user.hub_user) {
          setHubUrl("/" + user.hub_user.url);
        }
      } else {
        hub_user_id = user._id.$oid;
        setHubUrl("/" + user.url);
      }
    }
    getData(hub_user_id);
  }, []);

  const getFilteredData = () => {
    return allData.filter((item) => {
      // matches<Property> is true if no options selected, or if mentor has AT LEAST one of the selected options
      const matchesText =
        !query ||
        item.name.toUpperCase().includes(query.toUpperCase()) ||
        (item.description &&
          item.description.toUpperCase().includes(query.toUpperCase())) ||
        (item.name && item.name.toUpperCase().includes(query.toUpperCase()));

      return matchesText;
    });
  };

  function truncate(str, maxLength) {
    return str.length > maxLength ? (
      <Tooltip title={str}> {str.substring(0, maxLength - 3) + "..."} </Tooltip>
    ) : (
      str
    );
  }

  const getFilterForm = () => (
    <>
      <Title
        level={4}
        className={css`
          margin-top: 0;
        `}
      >
        {t("gallery.filterBy")}
      </Title>
      <Input
        placeholder={t("gallery.searchByName")}
        prefix={<SearchOutlined />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </>
  );

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
    let response = await getAnnounceDoc(record.id, lang);
    if (!response) {
      notification.error({
        message: "ERROR",
        description: "Couldn't download file",
      });
      return;
    }
    downloadBlob(response, record.file_name);
  };

  // Add some kind of error 403 code
  return (
    <>
      <Affix offsetTop={10}>
        <div style={{ display: "flex" }}>
          <Button
            onClick={() => setMobileFilterVisible(true)}
            className={css`
              display: none;
              @media only screen and (max-width: 640px) {
                margin-top: 2%;
                margin-left: 2%;
                display: grid;
              }
            `}
            type="primary"
          >
            {t("gallery.filter")}
          </Button>
        </div>
      </Affix>
      <Modal
        onCancel={() => {
          setMobileFilterVisible(false);
        }}
        open={mobileFilterVisible}
        footer={[
          <Button onClick={() => setMobileFilterVisible(false)} type="primary">
            {t("common.apply")}
          </Button>,
          <Button
            onClick={() => {
              setMobileFilterVisible(false);
              setQuery("");
            }}
          >
            {t("common.cancel")}
          </Button>,
        ]}
        bodyStyle={{
          padding: "1rem",
        }}
      >
        {getFilterForm()}
      </Modal>
      <div className="gallery-container">
        <FloatButton.BackTop />
        <Affix offsetTop={10}>
          <div
            className={css`
              margin-right: 1em;
              width: 15rem;
              padding: 1em;
              border-radius: 8px;
              height: fit-content;
              border: 2px solid ${colorPrimaryBg};

              @media only screen and (max-width: 640px) {
                display: none;
              }
            `}
          >
            {getFilterForm()}
          </div>
        </Affix>

        {!pageLoaded ? (
          <div
            className={css`
              display: flex;
              flex: 1;
              justify-content: center;
              align-items: center;
              height: 80vh;
            `}
          >
            <Spin size="large" spinning />
          </div>
        ) : (
          <div className="gallery-mentor-container">
            {getFilteredData().map((item, key) => {
              return (
                <div
                  className={css`
                    background-color: white;
                    border: 2px solid ${colorPrimaryBg};
                    border-radius: 8px;
                    position: relative;
                    height: 27em;
                    padding: 20px;
                    padding-top: 0px;
                    :hover {
                      box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
                    }
                  `}
                >
                  <div
                    className="gallery-card-body"
                    style={{ height: "90%", overflowY: "auto" }}
                  >
                    <div
                      className="gallery-card-header"
                      style={{ height: "4.5rem" }}
                    >
                      <div
                        className="gallery-header-text gallery-info-section"
                        style={{ paddingLeft: "0px" }}
                      >
                        <Title
                          style={styles.title}
                          className="gallery-title-text"
                        >
                          {truncate(item.name, 15)}
                        </Title>
                      </div>
                    </div>
                    <div className="gallery-info-section flex">
                      {item.description && (
                        <Typography style={{ width: "auto", minWidth: "50%" }}>
                          <Paragraph
                            style={{
                              fontSize: "18px",
                              fontWeight: 600,
                              marginTop: "-5px",
                              marginBottom: "5px",
                            }}
                          >
                            {t("events.summary")}:
                          </Paragraph>
                          <Paragraph
                            style={{
                              fontSize: "16px",
                              marginTop: "5px",
                              marginBottom: "5px",
                              paddingRight: "5px",
                              whiteSpace: "normal",
                            }}
                          >
                            {" "}
                            {truncate(item.description, 30)}
                          </Paragraph>
                        </Typography>
                      )}
                      {item.image && (
                        <Typography style={{ width: "50%" }}>
                          <img
                            style={{ height: "140px", maxWidth: "100%" }}
                            className="event-img"
                            src={item.image.url}
                            alt=""
                          />
                        </Typography>
                      )}
                    </div>
                    {item.file_name && (
                      <div style={{ marginTop: "30px" }}>
                        <AdminDownloadDropdown
                          options={getAvailableLangs(Item)}
                          title={item.file_name}
                          onClick={(lang) => handleAnnounceDownload(item, lang)}
                        />
                      </div>
                    )}
                  </div>
                  <div
                    className={css`
                      border-top: 3px solid ${colorPrimary};
                      position: absolute;
                      bottom: -5px;
                      width: 90%;
                    `}
                  >
                    <div className="gallery-button">
                      <NavLink to={hubUrl + `/announcement/${item._id.$oid}`}>
                        <Button style={{ marginRight: "10px" }} type="primary">
                          {t("events.view")}
                        </Button>
                      </NavLink>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default Announcements;
