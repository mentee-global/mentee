import React, { useState, useEffect, useRef } from "react";
import { editAccountProfile } from "utils/api";
import { fetchUser } from "features/userSlice";
import { Input, theme, Affix, Button, FloatButton, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import "../css/Gallery.scss";
import { useAuth } from "../../utils/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";
import { ACCOUNT_TYPE } from "utils/consts";
import { useDispatch, useSelector } from "react-redux";

function HubInviteLink() {
  const {
    token: { colorPrimaryBg },
  } = theme.useToken();
  const { t } = useTranslation();
  const [inviteLink, setInviteLink] = useState(null);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [messageApi, contextHolder] = message.useMessage();
  const inputRef = useRef(null);

  useEffect(() => {
    if (user) {
      if (user.invite_key) {
        setInviteLink(
          window.location.host + "/" + user.url + "/" + user.invite_key
        );
      }
    }
  }, []);

  const copyInviteLink = () => {
    if (inviteLink) {
      inputRef.current.select();
      document.execCommand("copy");
      messageApi.success("Copied");
    }
  };

  const generateLink = async () => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let key = "";

    for (let i = 0; i < 20; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      key += charset[randomIndex];
    }
    setInviteLink(window.location.host + "/" + user.url + "/" + key);
    var edit_data = {
      invite_key: key,
    };
    await editAccountProfile(edit_data, user._id.$oid, ACCOUNT_TYPE.HUB);
    dispatch(fetchUser({ id: user._id.$oid, role: ACCOUNT_TYPE.HUB }));
  };

  // Add some kind of error 403 code
  return (
    <>
      <div className="gallery-container">
        <FloatButton.BackTop />
        {contextHolder}
        <Affix offsetTop={10}>
          <div style={{ display: "flex" }}>
            <Button
              className={css`
                margin-top: 10px;
                margin-bottom: 10px;
                @media only screen and (max-width: 640px) {
                  display: none;
                }
              `}
              type="primary"
              onClick={() => {
                generateLink();
              }}
            >
              {t("sidebars.generate_invite_link")}
            </Button>
            <div
              style={{
                display: "flex",
                lineHeight: "3rem",
                fontSize: "1.2rem",
              }}
            >
              <div style={{ marginLeft: "1rem", marginRight: "1rem" }}>
                <Input
                  style={{ width: "25rem" }}
                  value={inviteLink}
                  ref={inputRef}
                  readOnly
                />
              </div>
              <div
                style={{ cursor: "pointer" }}
                onClick={() => copyInviteLink()}
              >
                <CopyOutlined />
              </div>
            </div>
          </div>
        </Affix>
      </div>
    </>
  );
}

export default HubInviteLink;
