import React from "react";
import { Layout, theme } from "antd";
import { withRouter, useHistory } from "react-router-dom";
import { css } from "@emotion/css";
import { useTranslation } from "react-i18next";
import "components/css/Navigation.scss";
// import { ReactComponent as Logo } from "resources/mentee.svg";
import BigLogoImage from "resources/Mentee_logo_letter.png";

const { Footer } = Layout;

function HubFooter() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const { t } = useTranslation();
  const history = useHistory();
  // TODO: Add a proper admin notifications dropdown
  return (
    <Footer
      className="navigation-footer"
      style={{ background: colorBgContainer }}
      theme="light"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "15px",
          fontStyle: "italic",
          paddingTop: "10px"
        }}
      >
        <span>{t("common.powered_by")}</span>
        <img
          src={BigLogoImage}
          alt={""}
          className={css`
            height: 40px;
            cursor: pointer;
            margin-left: 6px;
          `}
          onClick={() => history.push("/")}
        />
      </div>
    </Footer>
  );
}

export default withRouter(HubFooter);
