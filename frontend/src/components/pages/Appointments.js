import React, { useState, useEffect } from "react";
import { Form, Button, Result, Checkbox, Spin, theme, Tabs } from "antd";
import {
  ClockCircleOutlined,
  InfoCircleFilled,
  SmileOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import "components/css/Appointments.scss";
import { formatAppointments } from "utils/dateFormatting";
import AvailabilityCalendar from "components/AvailabilityCalendar";
import {
  acceptAppointment,
  fetchAppointmentsByMentorId,
  deleteAppointment,
} from "utils/api";
import { ACCOUNT_TYPE } from "utils/consts";
import AppointmentInfo from "../AppointmentInfo";
import MenteeButton from "../MenteeButton.js";
import { useAuth } from "utils/hooks/useAuth";
import { updateAndFetchUser } from "features/userSlice";
import { useTranslation } from "react-i18next";
import { getTranslatedOptions } from "utils/translations";
import { useMediaQuery } from "react-responsive";
import i18n from "utils/i18n";
import AddAppointmentModal from "components/AddAppointmentModal";

const TabKeys = Object.freeze({
  upcoming: "upcoming",
  past: "past",
  availability: "availability",
});

function Appointments() {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const { t } = useTranslation();
  const user = useSelector((state) => state.user.user);
  const options = useSelector((state) => state.options);
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState({});
  const [appointmentClick, setAppointmentClick] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAppointment, setModalAppointment] = useState({});
  const { onAuthStateChanged, role, profileId } = useAuth();
  const [takeAppoinment, setTakeappoinment] = useState(
    user?.taking_appointments
  );
  const [manualModalvisible, setManualModalvisible] = useState(false);
  const [currentTab, setCurrentTab] = useState("upcoming");
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const tabLabels = {
    upcoming: t("mentorAppointmentPage.upcoming"),
    past: t("mentorAppointmentPage.past"),
    availability: t("mentorAppointmentPage.availability"),
  };

  useEffect(() => {
    async function getAppointments() {
      if (!profileId) return;

      setIsLoading(true);

      const mentorID = profileId;
      const appointmentsResponse = await fetchAppointmentsByMentorId(mentorID);

      const formattedAppointments = formatAppointments(
        appointmentsResponse,
        ACCOUNT_TYPE.MENTOR
      );
      if (formattedAppointments) {
        setAppointments(formattedAppointments);
        if (formattedAppointments["pending"][0]) {
        }
      }
      setIsLoading(false);
    }

    onAuthStateChanged(getAppointments);
  }, [appointmentClick, profileId, onAuthStateChanged, i18n.language]);

  useEffect(() => {
    if (!user) return;
    setTakeappoinment(user.taking_appointments);
  }, [user]);

  async function handleTakeAppointments(e) {
    const data = { taking_appointments: e };
    dispatch(updateAndFetchUser({ data, id: profileId, role }));
  }

  async function handleAppointmentClick(id, didAccept) {
    if (didAccept) {
      await acceptAppointment(id);
    } else {
      await deleteAppointment(id);
    }
    setAppointmentClick(!appointmentClick);
    setModalVisible(false);
  }

  const getAppointmentButton = (tab, info) => {
    if (tab === TabKeys.upcoming) {
      return (
        <Button
          className="appointment-more-details"
          icon={
            <InfoCircleFilled
              style={{ ...styles.appointmentButtons, color: colorPrimary }}
            />
          }
          type="text"
          onClick={() => ViewAppointmentDetails(info)}
        ></Button>
      );
    } else if (tab === TabKeys.pending) {
      return (
        <MenteeButton
          content={<b>Review</b>}
          onClick={() => AcceptRejectAppointment(info)}
        ></MenteeButton>
      );
    }
  };
  const Appointment = ({ info }) => {
    return (
      <div className="appointment-card">
        <div>
          <div className="appointment-mentee-name">
            <b>{info.name}</b>
          </div>
          <div className="appointment-time">
            <ClockCircleOutlined /> {info.time}
          </div>
          <div className="appointment-description">
            {getTranslatedOptions(info.topic, options.specializations)}
          </div>
        </div>
        {getAppointmentButton(currentTab, info)}
      </div>
    );
  };
  const AcceptRejectAppointment = (props) => {
    setModalVisible(true);
    setModalAppointment(props);
  };
  const ViewAppointmentDetails = (props) => {
    setModalVisible(true);
    setModalAppointment(props);
  };
  const AvailabilityTab = ({ data }) => {
    return (
      <div>
        <div className="availability-container"></div>
        <div
          className="availability-container"
          style={{
            opacity: user?.taking_appointments ? 1 : 0.25,
            pointerEvents: user?.taking_appointments ? "initial" : "none",
          }}
        >
          <div className="calendar-header">{t("availability.title")}</div>
          <div className="calendar-container">
            <AvailabilityCalendar appointmentdata={data} />
          </div>
        </div>
      </div>
    );
  };
  const Appointments = ({ data }) => {
    if (!data || !data.length) {
      return (
        <div className="empty-appointments-list appointments-background">
          <Result
            icon={<SmileOutlined style={{ color: colorPrimary }} />}
            title={t("mentorAppointmentPage.noAppointments")}
          />
        </div>
      );
    }
    return (
      <div>
        <div className="appointments-background">
          {data.map((appointmentsObject, index) => (
            <div key={index} className="appointments-date-block">
              <div className="appointments-date-text-block">
                <h1 className="appointments-date-number">
                  {appointmentsObject.date}
                </h1>
                <p>{appointmentsObject.date_name}</p>
              </div>
              <div className="appointments-row">
                {/* TODO: Change the appointment component to fetch mentee info */}
                {appointmentsObject.appointments.map((appointment, index) => (
                  <Appointment key={index} info={appointment} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const tabItems = [
    {
      key: TabKeys.upcoming,
      label: tabLabels.upcoming,
      children: <Appointments data={appointments[TabKeys.upcoming]} />,
    },
    {
      key: TabKeys.past,
      label: tabLabels.past,
      children: <Appointments data={appointments[TabKeys.past]} />,
    },
    {
      key: TabKeys.availability,
      label: tabLabels.availability,
      children: <AvailabilityTab data={appointments[TabKeys.upcoming]} />,
    },
  ];

  return (
    <div>
      <AppointmentInfo
        setModalVisible={setModalVisible}
        modalVisible={modalVisible}
        current_tab={currentTab}
        handleAppointmentClick={handleAppointmentClick}
        modalAppointment={modalAppointment}
      />
      <div className="appointments-column">
        <div className="appointments-welcome-box">
          <div className="appointments-welcome-text">
            {t("mentorAppointmentPage.welcome", { name: user?.name })}
          </div>
          <Checkbox
            className="modal-availability-checkbox-text t-a-c-b"
            onChange={(e) => {
              setTakeappoinment(e.target.checked);
              handleTakeAppointments(e.target.checked);
            }}
            checked={takeAppoinment}
            style={{ marginLeft: "1%" }}
          >
            {t("mentorAppointmentPage.takingAppointments")}
          </Checkbox>
          <div
            style={{
              marginLeft: "1%",
              marginTop: "12px",
            }}
          >
            <Button
              style={{ marginBottom: "10px" }}
              type="primary"
              onClick={() => {
                setManualModalvisible(true);
              }}
            >
              {t("mentorAppointmentPage.addAppointment")}
            </Button>
            <AddAppointmentModal
              open={manualModalvisible}
              appointmentClick={appointmentClick}
              setAppointmentClick={setAppointmentClick}
              setOpen={setManualModalvisible}
            />
            <Spin spinning={isLoading}>
              <Tabs
                items={tabItems}
                defaultActiveKey="upcoming"
                onChange={(tab) => setCurrentTab(tab)}
              />
            </Spin>
          </div>
        </div>
      </div>
    </div>
  );
}
const styles = {
  calendar: {
    borderLeft: "3px solid #E5E5E5",
  },
  appointmentButtons: {
    fontSize: "24px",
  },
};
export default Appointments;
