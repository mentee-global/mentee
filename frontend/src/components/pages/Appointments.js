import React, { useState, useEffect } from "react";
import moment from "moment";
import {
  Form,
  Button,
  Result,
  Checkbox,
  Modal,
  TimePicker,
  DatePicker,
  notification,
  Spin,
  theme,
} from "antd";
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
  fetchMentees,
  fetchPartners,
  createAppointment,
} from "utils/api";
import { ACCOUNT_TYPE, APPOINTMENT_STATUS } from "utils/consts";
import AppointmentInfo from "../AppointmentInfo";
import MenteeButton from "../MenteeButton.js";
import { useAuth } from "utils/hooks/useAuth";
import { updateAndFetchUser } from "features/userSlice";
import ModalInput from "components/ModalInput";
import { useTranslation } from "react-i18next";
import { getTranslatedOptions } from "utils/translations";

//TODO: Fix this tabs rendering translation

const Tabs = Object.freeze({
  upcoming: "upcoming",
  past: "past",
  availability: "availability",
});

function Appointments() {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(Tabs.upcoming);
  const tabTitles = {
    upcoming: t("mentorAppointmentPage.upcoming"),
    past: t("mentorAppointmentPage.past"),
    availability: t("mentorAppointmentPage.availability"),
  };
  const [appointments, setAppointments] = useState({});
  const [appointmentClick, setAppointmentClick] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const user = useSelector((state) => state.user.user);
  const options = useSelector((state) => state.options);
  const [modalAppointment, setModalAppointment] = useState({});
  const { isAdmin, onAuthStateChanged, role, profileId } = useAuth();
  const [takeAppoinment, setTakeappoinment] = useState(
    user?.taking_appointments
  );

  const [manualModalvisible, setManualModalvisible] = useState(false);
  const [menteeArr, setMenteeArr] = useState([]);
  const [topic, setTopic] = useState();
  const [message, setMessage] = useState();
  const [selectedMenteeID, setSelectedMenteeID] = useState(undefined);
  const [selectedDate, setSelectedDate] = useState();
  const [selectedStarttime, setSelectedStarttime] = useState();
  const [selectedEndtime, setSelectedEndtime] = useState();
  const [form] = Form.useForm();

  const dispatch = useDispatch();

  const validationMessage = {
    required: t("mentorAppointmentPage.validName"),
    types: {
      email: t("mentorAppointmentPage.validEmail"),
    },
  };

  async function getMentees() {
    const mentee_data = await fetchMentees();
    if (mentee_data) {
      if (user && user.pair_partner && user.pair_partner.restricted) {
        if (user.pair_partner.assign_mentees) {
          var temp = [];
          mentee_data.map((mentee_item) => {
            var check_exist = user.pair_partner.assign_mentees.find(
              (x) => x.id === mentee_item._id.$oid
            );
            if (check_exist) {
              temp.push(mentee_item);
            }
            return false;
          });
        }
      } else {
        var restricted_partners = await fetchPartners(true);
        if (!isAdmin && restricted_partners && restricted_partners.length > 0) {
          var assigned_mentee_ids = [];
          restricted_partners.map((partner_item) => {
            if (partner_item.assign_mentees) {
              partner_item.assign_mentees.map((assign_item) => {
                assigned_mentee_ids.push(assign_item.id);
                return false;
              });
            }
            return false;
          });
          temp = [];
          mentee_data.map((mentee_item) => {
            if (!assigned_mentee_ids.includes(mentee_item._id.$oid)) {
              temp.push(mentee_item);
            }
            return false;
          });
        } else {
          temp = mentee_data;
        }
      }
    }
    var res = [];
    for (let mentee_item of temp) {
      res.push({ id: mentee_item._id.$oid, name: mentee_item.name });
    }
    setMenteeArr(res);
  }
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
  }, [appointmentClick, profileId, onAuthStateChanged]);

  useEffect(() => {
    getMentees();
  }, []);

  useEffect(() => {
    if (!user) return;
    setTakeappoinment(user.taking_appointments);
  }, [user]);

  // Resets form fields on close
  useEffect(() => {
    if (manualModalvisible) {
      form.resetFields();
    }
  }, [manualModalvisible, form]);

  async function handleTakeAppointments(e) {
    const data = { taking_appointments: e };
    dispatch(updateAndFetchUser({ data, id: profileId, role }));
  }

  async function handleManualSave() {
    // document.getElementById("date_error").style.display = "none";
    document.getElementById("time_error").style.display = "none";
    // var now = moment();
    // if (selectedDate.isAfter(now)) {
    //   document.getElementById("date_error").style.display = "block";
    //   return;
    // }
    if (selectedEndtime < selectedStarttime) {
      document.getElementById("time_error").style.display = "block";
      return;
    }
    setManualModalvisible(false);
    const appointment = {};
    appointment["mentor_id"] = profileId;
    appointment["mentee_id"] = selectedMenteeID;
    appointment["topic"] = topic;
    appointment["message"] = message;
    appointment["status"] = APPOINTMENT_STATUS.ACCEPTED;
    appointment["timeslot"] = {
      start_time: moment(
        selectedDate.format("YYYY-MM-DD") +
          " " +
          selectedStarttime.format("HH:mm:ss")
      ).format(),
      end_time: moment(
        selectedDate.format("YYYY-MM-DD") +
          " " +
          selectedEndtime.format("HH:mm:ss")
      ).format(),
    };
    var res = await createAppointment(appointment);
    if (res) {
      notification["success"]({
        message: t("mentorAppointmentPage.successBooking"),
      });
    } else {
      notification["error"]({
        message: t("mentorAppointmentPage.errorBooking"),
      });
    }
    setAppointmentClick(!appointmentClick);
    //reset value---------
    setSelectedMenteeID();
    setTopic();
    setMessage();
    setSelectedDate();
    setSelectedEndtime();
    setSelectedStarttime();
    //---------
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
  // TODO: Swap this to emotion styled components
  const getButtonStyle = (tab) => {
    const active = colorPrimary;
    const inactive = "white";
    return {
      borderRadius: 13,
      marginRight: 15,
      backgroundColor: currentTab === tab ? active : inactive,
    };
  };
  const getButtonTextStyle = (tab) => {
    const active = "white";
    const inactive = colorPrimary;
    return {
      fontWeight: 700,
      color: currentTab === tab ? active : inactive,
    };
  };
  const Tab = (props) => (
    <Button
      shape="round"
      size="small"
      style={getButtonStyle(props.tab)}
      onClick={() => setCurrentTab(props.tab)}
    >
      <div style={getButtonTextStyle(props.tab)}>{props.text}</div>
    </Button>
  );
  const getAppointmentButton = (tab, info) => {
    if (tab === Tabs.upcoming) {
      return (
        <Button
          className="appointment-more-details"
          icon={
            <InfoCircleFilled
              style={{ ...styles.appointment_buttons, color: colorPrimary }}
            />
          }
          type="text"
          onClick={() => ViewAppointmentDetails(info)}
        ></Button>
      );
    } else if (tab === Tabs.pending) {
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
        <b className="appointment-tabs-title">{tabTitles[currentTab.key]}</b>
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
  function renderTab(tab) {
    switch (tab) {
      case Tabs.upcoming: // Fall through
      case Tabs.pending: // Fall through
      case Tabs.past:
        return <Appointments data={appointments[currentTab]} />;
      case Tabs.availability:
        return <AvailabilityTab data={appointments[Tabs.upcoming]} />;
      default:
        return <div />;
    }
  }
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
              marginBottom: "15px",
            }}
          >
            <MenteeButton
              style={{ marginBottom: "10px" }}
              theme="dark"
              content={<b>{t("mentorAppointmentPage.addAppointment")}</b>}
              onClick={() => {
                setManualModalvisible(true);
              }}
            />
          </div>
          <div className="appointments-tabs">
            {Object.keys(tabTitles).map((tab, index) => (
              <Tab tab={tab} text={tabTitles[tab]} key={index} />
            ))}
          </div>
        </div>
        <Spin spinning={isLoading}>{renderTab(currentTab)}</Spin>
      </div>
      <Modal
        className="manual-add-modal"
        title={t("mentorAppointmentPage.addAppointment")}
        open={manualModalvisible}
        onCancel={() => setManualModalvisible(false)}
        footer={[
          <MenteeButton
            key="save"
            type="primary"
            htmlType="submit"
            form={"manual-form"}
            content={t("common.save")}
          />,
        ]}
      >
        <Form
          form={form}
          id="manual-form"
          onFinish={() => handleManualSave()}
          validateMessages={validationMessage}
        >
          <div
            className="modal-mentee-appointment-header-text"
            style={{ marginTop: "10px" }}
          >
            {t("common.mentee")}*
          </div>
          <Form.Item
            name="Mentee"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <ModalInput
              value={selectedMenteeID}
              type="dropdown-single-object"
              options={menteeArr}
              placeholder={t("mentorAppointmentPage.selectMentee")}
              // clicked={inputClicked[0]}
              index={0}
              handleClick={() => {}}
              onChange={(value) => {
                setSelectedMenteeID(value);
              }}
            />
          </Form.Item>
          <div
            className="modal-mentee-appointment-header-text"
            style={{ marginTop: "10px" }}
          >
            {t("mentorAppointmentPage.meetingDate")}*
          </div>
          <div className="timeslot-wrapper" style={{ display: "flex" }}>
            <Form.Item
              name="Date"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <DatePicker
                style={{ marginRight: "10px" }}
                value={selectedDate}
                placeholder={t("mentorAppointmentPage.selectDate")}
                onChange={(e) => setSelectedDate(e)}
              />
            </Form.Item>
            <Form.Item
              name="Start Time"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <TimePicker
                placeholder={t("mentorAppointmentPage.startTime")}
                use12Hours={false}
                format="h:mm A"
                value={selectedStarttime}
                onChange={(e) => setSelectedStarttime(e)}
              />
            </Form.Item>

            <span
              className="timeslot"
              style={{ fontSize: "16px", marginTop: "4px" }}
            >
              {" "}
              ～{" "}
            </span>
            <Form.Item
              name="End Time"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <TimePicker
                placeholder={t("mentorAppointmentPage.endTime")}
                use12Hours={false}
                format="h:mm A"
                value={selectedEndtime}
                onChange={(e) => setSelectedEndtime(e)}
              />
            </Form.Item>
          </div>
          {/* <p id="date_error" className="error">
            Select date in the past
          </p> */}
          <p id="time_error" className="error">
            {t("mentorAppointmentPage.invalidTimeslot")}
          </p>
          <div
            className="modal-mentee-appointment-header-text"
            style={{ marginTop: "10px" }}
          >
            {t("mentorAppointmentPage.meetingTopic")}*
          </div>
          <Form.Item
            name="Topic"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <ModalInput
              value={topic}
              type="dropdown-single"
              options={options.specializations}
              placeholder={t("mentorAppointmentPage.selectTopic")}
              // clicked={inputClicked[0]}
              index={1}
              handleClick={() => {}}
              onChange={(e) => setTopic(e)}
            />
          </Form.Item>
          <div
            className="modal-mentee-appointment-header-text"
            style={{ marginTop: "10px" }}
          >
            {t("mentorAppointmentPage.meetingSummary")}*
          </div>
          <Form.Item
            name="Summary"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <ModalInput
              type="textarea"
              maxRows={11}
              // clicked={inputClicked[1]}
              index={2}
              handleClick={() => {}}
              onChange={(e) => setMessage(e.target.value)}
              value={message}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
const styles = {
  calendar: {
    borderLeft: "3px solid #E5E5E5",
  },
  appointment_buttons: {
    fontSize: "24px",
  },
};
export default Appointments;
