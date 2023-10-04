import React, { useState, useEffect } from "react";
import {
  fetchMentors,
  fetchMentees,
  fetchPartners,
  fetchEvents,
  fetchAccounts,
} from "utils/api";
import EventCard from "../EventCard";
import {
  Input,
  Checkbox,
  Modal,
  Spin,
  theme,
  Typography,
  Affix,
  Button,
  FloatButton,
  Select,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import "../css/Gallery.scss";
import { useAuth } from "../../utils/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";
import AddEventModal from "components/AddEventModal";
import { ACCOUNT_TYPE } from "utils/consts";

const { Title } = Typography;

function Events() {
  const {
    token: { colorPrimaryBg },
  } = theme.useToken();
  const { t } = useTranslation();
  const { isAdmin, role } = useAuth();
  const [eventModalvisible, setEventModalvisible] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [query, setQuery] = useState();
  const [searchRole, setSearchRole] = useState(0);
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [users, setUsers] = useState([]);
  const [upcomingFlag, setUpcomingFlag] = useState(false);
  const [pastFlag, setPastFlag] = useState(false);
  const [reload, setReload] = useState(true);

  useEffect(() => {
    async function getAllEvents() {
      if (!isAdmin) {
        const user_data = await fetchAccounts(role);
        setUsers(user_data);
      } else {
        const mentor_data = await fetchMentors();
        const mentee_data = await fetchMentees();
        const partenr_data = await fetchPartners();
        setUsers([...mentee_data, ...mentor_data, ...partenr_data]);
      }
      const all_evnet_data = await fetchEvents(role);
      setAllEvents(all_evnet_data);
      setPageLoaded(true);
    }

    getAllEvents();
  }, [reload]);

  const getFilteredEvents = () => {
    return allEvents.filter((item) => {
      // matches<Property> is true if no options selected, or if mentor has AT LEAST one of the selected options
      const matchesText =
        !query ||
        item.title.toUpperCase().includes(query.toUpperCase()) ||
        (item.description &&
          item.description.toUpperCase().includes(query.toUpperCase())) ||
        (item.title && item.title.toUpperCase().includes(query.toUpperCase()));

      const matchesUpcoming =
        !upcomingFlag ||
        !item.start_datetime ||
        new Date(item.start_datetime.$date).getTime() >= new Date().getTime();

      const matchesPast =
        !pastFlag ||
        (item.start_datetime &&
          new Date(item.start_datetime.$date).getTime() < new Date().getTime());

      const matchRole = !(searchRole > 0) || parseInt(item.role) === searchRole;

      return matchesText && matchesUpcoming && matchesPast && matchRole;
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
      {isAdmin && (
        <Select
          className={css`
            width: 100%;
            margin-top: 10px;
          `}
          allowClear
          // mode="multiple"
          placeholder={t("events.searchByRole")}
          options={[
            { value: 0, label: " " },
            { value: ACCOUNT_TYPE.MENTEE, label: "Mentee" },
            { value: ACCOUNT_TYPE.MENTOR, label: "Mentor" },
            { value: ACCOUNT_TYPE.PARTNER, label: "Partner" },
          ]}
          onChange={(selected) => setSearchRole(selected)}
          maxTagCount="responsive"
        />
      )}
      <div style={{ marginTop: "15px" }}>
        <Checkbox
          className="modal-availability-checkbox-text"
          onChange={(e) => {
            setUpcomingFlag(e.target.checked);
          }}
          checked={upcomingFlag}
          disabled={pastFlag}
        >
          {t("events.upcoming")}{" "}
        </Checkbox>
        <Checkbox
          className="modal-availability-checkbox-text"
          onChange={(e) => {
            setPastFlag(e.target.checked);
          }}
          checked={pastFlag}
          disabled={upcomingFlag}
        >
          {t("events.past")}{" "}
        </Checkbox>
      </div>
    </>
  );

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
          <Button
            className={css`
              display: none;
              margin-top: 2%;
              margin-left: 2%;
              @media only screen and (max-width: 640px) {
                display: grid;
              }
            `}
            type="primary"
            onClick={() => {
              setEventModalvisible(true);
            }}
          >
            {t("events.addEvent")}
          </Button>
          <AddEventModal
            role={role}
            open={eventModalvisible}
            setOpen={setEventModalvisible}
            refresh={() => setReload(!reload)}
            reloading={() => setPageLoaded(false)}
          />
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
              setEventModalvisible(true);
            }}
          >
            {t("events.addEvent")}
          </Button>
          <AddEventModal
            role={role}
            open={eventModalvisible}
            setOpen={setEventModalvisible}
            refresh={() => setReload(!reload)}
            reloading={() => setPageLoaded(false)}
          />
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
            {getFilteredEvents().map((item, key) => {
              return (
                <EventCard
                  key={key}
                  event_item={item}
                  users={users}
                  refresh={() => setReload(!reload)}
                  reloading={() => setPageLoaded(false)}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default Events;
