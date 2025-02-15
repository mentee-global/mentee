import React, { useState, useEffect } from "react";
import {
  DatePicker,
  Modal,
  TimePicker,
  notification,
  Form,
  Input,
  Drawer,
  Button,
  Space,
  Upload,
  Select,
} from "antd";
import ImgCrop from "antd-img-crop";
import moment from "moment";
import { createEvent, uploadEventImage } from "utils/api";
import { UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "utils/hooks/useAuth";
import { useMediaQuery } from "react-responsive";
import { validateUrl } from "utils/misc";
import { ACCOUNT_TYPE } from "utils/consts";
import { useSelector } from "react-redux";

const { Option } = Select;

function AddEventModal({
  role,
  open,
  hubOptions,
  setOpen,
  event_item,
  refresh,
  reloading,
  partnerData,
}) {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const { t } = useTranslation();
  const { isAdmin, isMentor, isPartner, isMentee, profileId, isHub } =
    useAuth();
  const [form] = Form.useForm();

  const [image, setImage] = useState(
    event_item && event_item.image_file ? event_item.image_file : null
  );
  const [changedImage, setChangedImage] = useState(false);
  const user = useSelector((state) => state.user.user);
  const [userRole, setUserRole] = useState([]);
  const [partnerIDs, setPartnerIDs] = useState([]);

  // TODO: clean up this useEffect and its useState
  useEffect(() => {
    if (event_item) {
      form.setFieldValue("title", event_item.title);
      form.setFieldValue("url", event_item.url);
      form.setFieldValue("description", event_item.description);
      if (
        typeof event_item.role == "string" ||
        typeof event_item.role == "number"
      ) {
        form.setFieldValue("user_role", [parseInt(event_item.role)]);
        setUserRole([parseInt(event_item.role)]);
      } else {
        form.setFieldValue("user_role", event_item.role);
        setUserRole(event_item.role);
      }
      if (event_item.hub_id) {
        form.setFieldValue("hub_id", event_item.hub_id);
      }
      if (event_item.partner_ids) {
        form.setFieldValue("partner_ids", event_item.partner_ids);
        setPartnerIDs(event_item.partner_ids);
      }

      if (event_item.start_datetime) {
        form.setFieldValue(
          "start_date",
          moment(event_item.start_datetime.$date)
        );
        form.setFieldValue(
          "start_time",
          moment(event_item.start_datetime.$date)
        );
      }
      if (event_item.end_datetime) {
        form.setFieldValue("end_date", moment(event_item.end_datetime.$date));
        form.setFieldValue("end_time", moment(event_item.end_datetime.$date));
      }
      if (event_item.image_file) {
        setImage(event_item.image_file);
      }
    } else {
      if (role == ACCOUNT_TYPE.HUB) {
        form.setFieldValue("user_role", [ACCOUNT_TYPE.HUB]);
      }
    }
  }, [open]);

  async function handleSave(values) {
    // TODO: Optimize and swap these to dayjs
    var start_datetime = null;
    var start_datetime_str = null;
    var end_datetime = null;
    var end_datetime_str = null;
    start_datetime = values.start_date.format("YYYY-MM-DD");
    start_datetime_str = `${start_datetime} ${values.start_time.format(
      "HH:mm"
    )}`;
    start_datetime = moment(
      `${start_datetime} ${values.start_time.format("HH:mm:ss")}`
    );

    end_datetime = values.end_date.format("YYYY-MM-DD");
    end_datetime_str = `${end_datetime} ${values.end_time.format("HH:mm")}`;
    end_datetime = moment(
      `${end_datetime} ${values.end_time.format("HH:mm:ss")}`
    );

    var hub_user_id = null;
    if (role == ACCOUNT_TYPE.HUB && user) {
      if (user.hub_id) {
        hub_user_id = user.hub_id;
      } else {
        hub_user_id = user._id.$oid;
      }
    }

    const newEvent = {
      event_id: event_item ? event_item._id.$oid : 0,
      user_id: profileId ? profileId : user && user._id.$oid,
      title: values.title,
      role: values.user_role,
      start_datetime: start_datetime,
      start_datetime_str: start_datetime_str,
      end_datetime: end_datetime,
      end_datetime_str: end_datetime_str,
      description: values.description,
      url: values.url,
      hub_id: values.hub_id ? values.hub_id : hub_user_id,
      partner_ids: values.partner_ids,
    };

    reloading();
    var res = await createEvent(newEvent);
    if (res && res.data && res.data.success) {
      if (image) {
        await uploadEventImage(image, res.data.result.event._id.$oid);
      }
    }
    refresh();

    if (res) {
      notification["success"]({
        message: t("events.succuessAdd"),
      });
    } else {
      notification["error"]({
        message: t("events.errorAdd"),
        duration: 0,
        key: "errorAdd",
      });
    }
  }

  const onOk = () => {
    form
      .validateFields()
      .then((values) => {
        if (values.url && !validateUrl(values.url)) {
          notification["error"]({
            message: t("events.errorURL"),
            duration: 0,
            key: "errorURL",
          });
          return;
        }
        var start_datetime = values.start_date.format("YYYY-MM-DD");
        start_datetime = moment(
          `${start_datetime} ${values.start_time.format("HH:mm:ss")}`
        );
        var end_datetime = values.end_date.format("YYYY-MM-DD");
        end_datetime = moment(
          `${end_datetime} ${values.end_time.format("HH:mm:ss")}`
        );
        if (end_datetime.diff(start_datetime, "seconds") >= 0) {
          handleSave(values);
          form.resetFields();
          setImage(null);
          setOpen(false);
        } else {
          notification["error"]({
            message: t("events.errorTimeSetting"),
            duration: 0,
            key: "errorTimeSetting",
          });
          return;
        }
      })
      .catch((info) => {
        console.error("Validate Failed:", info);
      });
  };

  const onCancel = () => {
    // form.resetFields();
    setOpen(false);
  };

  const handleMultiSelectChange = (values) => {
    setPartnerIDs(values);
  };

  console.log('pppp', partnerIDs);

    const EventForm = (event_item) => (
    <Form form={form} layout="vertical">
      {isAdmin && (
        <>
          <Form.Item
            name="user_role"
            label={t("common.role")}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select
              allowClear
              mode="multiple"
              options={[
                { value: ACCOUNT_TYPE.MENTEE, label: "Mentee" },
                { value: ACCOUNT_TYPE.MENTOR, label: "Mentor" },
                { value: ACCOUNT_TYPE.PARTNER, label: "Partner" },
                { value: ACCOUNT_TYPE.HUB, label: "Hub" },
              ]}
              maxTagCount="responsive"
              onChange={(val) => setUserRole(val)}
            />
          </Form.Item>
          {userRole.includes(ACCOUNT_TYPE.HUB) && (
            <Form.Item
              name="hub_id"
              label={"Hub User"}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select options={hubOptions} maxTagCount="responsive" />
            </Form.Item>
          )}
        </>
      )}
      {isPartner && (
        <Form.Item
          name="user_role"
          label={t("common.role")}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            allowClear
            mode="multiple"
            options={[
              { value: ACCOUNT_TYPE.MENTEE, label: "Mentee" },
              { value: ACCOUNT_TYPE.MENTOR, label: "Mentor" },
              { value: ACCOUNT_TYPE.PARTNER, label: "Partner" },
            ]}
            maxTagCount="responsive"
          />
        </Form.Item>
      )}
      {isMentor && (
        <Form.Item
          name="user_role"
          label={t("common.role")}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            allowClear
            mode="multiple"
            options={[
              { value: ACCOUNT_TYPE.MENTEE, label: "Mentee" },
              { value: ACCOUNT_TYPE.MENTOR, label: "Mentor" },
            ]}
            maxTagCount="responsive"
          />
        </Form.Item>
      )}
      {isMentee && (
        <Form.Item
          name="user_role"
          label={t("common.role")}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            allowClear
            mode="multiple"
            options={[
              { value: ACCOUNT_TYPE.MENTEE, label: "Mentee" },
              { value: ACCOUNT_TYPE.MENTOR, label: "Mentor" },
            ]}
            maxTagCount="responsive"
          />
        </Form.Item>
      )}
      {isHub && (
        <>
          <Form.Item
            style={{ display: "none" }}
            name="user_role"
            label={t("common.role")}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select
              allowClear
              mode="multiple"
              options={[{ value: ACCOUNT_TYPE.HUB, label: "Hub" }]}
              maxTagCount="responsive"
            />
          </Form.Item>
        </>
      )}
      {isHub && (
        <Form.Item
          style={{ display: "none" }}
          name="user_role"
          label={t("common.role")}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            allowClear
            mode="multiple"
            options={[{ value: ACCOUNT_TYPE.HUB, label: "Hub" }]}
            maxTagCount="responsive"
          />
        </Form.Item>
      )}
      <Form.Item
        name="title"
        label={t("common.title")}
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input type="text" placeholder={t("events.eventTitle")} />
      </Form.Item>
      <Form.Item label={t("events.start")}>
        <Form.Item
          name="start_date"
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
          <DatePicker placeholder={t("events.startDate")} />
        </Form.Item>
        <Form.Item
          name="start_time"
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
          <TimePicker
            placeholder={t("events.startTime")}
            use12Hours={false}
            format="h:mm A"
          />
        </Form.Item>
      </Form.Item>
      <Form.Item label={t("events.end")}>
        <Form.Item
          name="end_date"
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
          <DatePicker placeholder={t("events.endDate")} />
        </Form.Item>
        <Form.Item
          name="end_time"
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
          <TimePicker
            placeholder={t("events.endTime")}
            use12Hours={false}
            format="h:mm A"
          />
        </Form.Item>
      </Form.Item>
      <Form.Item
        name="description"
        label={t("events.summary")}
        rules={[
          {
            required: false,
          },
        ]}
        style={{ marginTop: "1em" }}
      >
        <Input.TextArea
          rows={3}
          value={event_item ? event_item.description : ""}
        />
      </Form.Item>
      <Form.Item
        name="url"
        label={"URL"}
        rules={[
          {
            required: false,
          },
        ]}
      >
        <Input type="text" />
      </Form.Item>
      <ImgCrop rotate aspect={5 / 3} minZoom={0.2}>
        <Upload
          onChange={async (file) => {
            setImage(file.file.originFileObj);
            setChangedImage(true);
          }}
          accept=".png,.jpg,.jpeg"
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />} className="">
            {t("events.uploadImage")}
          </Button>
        </Upload>
      </ImgCrop>

      {image && (
        <img
          style={{ width: "100px", marginLeft: "15px" }}
          alt=""
          src={
            changedImage
              ? image && URL.createObjectURL(image)
              : image && image.url
          }
        />
      )}
      {isHub && partnerData && partnerData.length > 0 && (
        <>
          <Form.Item
            style={{marginTop:'20px'}}
            name="partner_ids"
            label="Partner"
            rules={[
              {
                required: false,
              },
            ]}
          >
            <Select 
              mode="multiple"
              onChange={handleMultiSelectChange}
              allowClear
            >
              {partnerData.map((item) => {
                return (
                  <Option
                    value={
                      item._id
                        ? item._id.$oid
                        : item.id.$oid
                        ? item.id.$oid
                        : item.id
                    }
                  >
                    {item.person_name}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        </>
      )}
    </Form>
  );
  return isMobile ? (
    <Drawer
      width={"100%"}
      title={t("events.addEvent")}
      open={open}
      onClose={onCancel}
    >
      {EventForm(event_item)}
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
      title={t("events.addEvent")}
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText={t("common.save")}
    >
      {EventForm(event_item)}
    </Modal>
  );
}

export default AddEventModal;
