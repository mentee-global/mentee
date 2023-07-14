import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateAndFetchUser } from "features/userSlice";
import { Dropdown, Button, Space } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { ACCOUNT_TYPE, I18N_LANGUAGES } from "utils/consts";

function LanguageDropdown() {
  const { t, i18n } = useTranslation();
  const { user, role } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const languageOptions = I18N_LANGUAGES.map(({ value }) => {
    return {
      key: value,
      label: (
        <span onClick={() => handleLanguageChange(value)}>
          {t(`languages.${value.split("-")[0]}`)}
        </span>
      ),
    };
  });

  useEffect(() => {
    if (user && role !== ACCOUNT_TYPE.ADMIN)
      i18n.changeLanguage(user.preferred_language);
  }, [user]);

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    moment.locale(language);
    if (user && role !== ACCOUNT_TYPE.ADMIN) {
      dispatch(
        updateAndFetchUser({
          data: { preferred_language: language },
          id: user.id,
          role: user.role,
        })
      );
    }
  };

  return (
    <Dropdown
      menu={{
        items: languageOptions,
        selectable: true,
        defaultSelectedKeys: [user.preferred_language ?? i18n.language],
      }}
    >
      <GlobalOutlined />
    </Dropdown>
  );
}

export default LanguageDropdown;
