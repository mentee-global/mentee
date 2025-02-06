import React, { useState, useEffect } from "react";
import {
  DatePicker,
  Modal,
  TimePicker,
  notification,
  Form,
  Select,
  Input,
  Drawer,
  Button,
  Row,
  Space,
} from "antd";
import moment from "moment";
import { createAppointment, fetchMentees, fetchPartners } from "utils/api";
import { APPOINTMENT_STATUS } from "utils/consts";

import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useAuth } from "utils/hooks/useAuth";
import { useMediaQuery } from "react-responsive";

function AddAppointmentModal({
  appointmentClick,
  setAppointmentClick,
  open,
  setOpen,
}) {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const { t } = useTranslation();
  const { isAdmin, profileId } = useAuth();
  const [menteeArr, setMenteeArr] = useState([]);
  const options = useSelector((state) => state.options);
  const user = useSelector((state) => state.user.user);
  const [form] = Form.useForm();

  // TODO: clean up this useEffect and its useState
  useEffect(() => {
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
          var restricted_partners = await fetchPartners(true, null);
          if (
            !isAdmin &&
            restricted_partners &&
            restricted_partners.length > 0
          ) {
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
        res.push({ value: mentee_item._id.$oid, label: mentee_item.name });
      }
      setMenteeArr(res);
    }

    getMentees();
  }, []);

  async function handleSave(values) {
    // TODO: Optimize and swap these to dayjs
    const selectedDate = values.date.format("YYYY-MM-DD");
    const startTime = moment(
      `${selectedDate} ${values.timeRange[0].format("HH:mm:ss")}`
    );
    const endTime = moment(
      `${selectedDate} ${values.timeRange[1].format("HH:mm:ss")}`
    );
    const newAppointment = {
      mentor_id: profileId,
      mentee_id: values.mentee,
      topic: values.topic,
      message: values.summary,
      status: APPOINTMENT_STATUS.ACCEPTED,
      timeslot: {
        start_time: startTime.format(),
        end_time: endTime.format(),
      },
    };

    var res = await createAppointment(newAppointment);
    if (res) {
      notification["success"]({
        message: t("mentorAppointmentPage.successBooking"),
      });
    } else {
      notification["error"]({
        message: t("mentorAppointmentPage.errorBooking"),
        duration: 0,
        key: "errorBooking",
      });
    }
  }

  const onOk = () => {
    form
      .validateFields()
      .then((values) => {
        handleSave(values);
        setAppointmentClick(!appointmentClick);
        form.resetFields();
        setOpen(false);
      })
      .catch((info) => {
        console.error("Validate Failed:", info);
      });
  };

  const onCancel = () => {
    form.resetFields();
    setOpen(false);
  };

  const addAppointmentForm = () => (
    <Form form={form} layout="vertical">
      <Form.Item
        name="mentee"
        label={t("common.mentee")}
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Select
          options={menteeArr}
          placeholder={t("mentorAppointmentPage.selectMentee")}
        />
      </Form.Item>
      <Form.Item label={t("mentorAppointmentPage.meetingDate")} required>
        <Form.Item
          name="date"
          rules={[
            {
              required: true,
            },
          ]}
          style={{
            display: "inline-block",
            marginRight: "1em",
            marginBottom: isMobile ? "1em" : "0",
          }}
        >
          <DatePicker placeholder={t("mentorAppointmentPage.selectDate")} />
        </Form.Item>
        <Form.Item
          name="timeRange"
          rules={[
            {
              required: true,
            },
          ]}
          style={{
            display: "inline-block",
            marginBottom: "0",
          }}
        >
          <TimePicker.RangePicker use12Hours={false} format="h:mm A" />
        </Form.Item>
      </Form.Item>
      <Form.Item
        name="topic"
        label={t("mentorAppointmentPage.meetingTopic")}
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Select
          options={options.specializations}
          placeholder={t("mentorAppointmentPage.selectTopic")}
        />
      </Form.Item>
      <Form.Item
        name="summary"
        label={t("mentorAppointmentPage.meetingSummary")}
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input.TextArea rows={5} />
      </Form.Item>
    </Form>
  );

  return isMobile ? (
    <Drawer
      width={"100%"}
      title={t("mentorAppointmentPage.addAppointment")}
      open={open}
      onClose={onCancel}
    >
      {addAppointmentForm()}
      <br />
      <Space>
        <Button onClick={onCancel}>{t("common.cancel")}</Button>
        <Button type="primary" onClick={onOk}>
          {t("common.save")}
        </Button>
      </Space>
    </Drawer>
  ) : (
    <Modal
      title={t("mentorAppointmentPage.addAppointment")}
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText={t("common.save")}
    >
      {addAppointmentForm()}
    </Modal>
  );
}

export default AddAppointmentModal;
