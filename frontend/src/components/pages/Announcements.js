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
  Table,
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

const { Title } = Typography;

function Announcements() {
  const {
    token: { colorPrimaryBg },
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

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <>{name}</>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description) => <>{description}</>,
    },
    {
      title: "Document",
      dataIndex: "file_name",
      key: "file_name",
      render: (file_name, record) => {
        if (file_name && file_name !== "") {
          return (
            <AdminDownloadDropdown
              options={getAvailableLangs(record)}
              title={file_name}
              onClick={(lang) => handleAnnounceDownload(record, lang)}
            />
          );
        }
      },
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (image) => {
        if (image) {
          return <img style={{ maxHeight: "50px" }} src={image.url} alt="" />;
        }
      },
    },
    {
      title: "",
      dataIndex: "id",
      key: "id",
      render: (id) => (
        <NavLink to={hubUrl + `/announcement/${id}`}>
          <Button style={{}} type="primary">
            {t("events.view")}
          </Button>
        </NavLink>
      ),
      align: "center",
    },
  ];

  // Add some kind of error 403 code
  return (
    <>
      <Affix offsetTop={10}>
        <div style={{ display: "flex", marginTop: "20px", marginLeft: "20px" }}>
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
      <div className="">
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
              margin-top: 20px;
              margin-left: 20px;
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
          <div style={{ padding: "20px" }}>
            <Table columns={columns} dataSource={getFilteredData()} />
          </div>
        )}
      </div>
    </>
  );
}

export default Announcements;
