import React, { useEffect, useState } from "react";
import { Button, Form, Input, Modal, Select, Upload, Checkbox } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { ACCOUNT_TYPE } from "utils/consts";
import "components/css/Training.scss";
import ImgCrop from "antd-img-crop";

const { Option } = Select;

const normFile = (e) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

// TODO: Change the weird names of some of the forms like typee and filee
function UpdateAnnouncementModal({
  onCancel,
  onFinish,
  open,
  currentAnnounce,
  loading,
  hubOptions,
  partnerOptions,
}) {
  const [form] = Form.useForm();
  const [valuesChanged, setValuesChanged] = useState(false);
  const [role, setRole] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [image, setImage] = useState(
    currentAnnounce && currentAnnounce.image ? currentAnnounce.image : null
  );
  const [changedImage, setChangedImage] = useState(false);
  const newAnnouncement = !currentAnnounce;

  const handleValuesChange = (changedValues, allValues) => {
    setValuesChanged(true);
  };

  const onOk = () => {
    if (valuesChanged) {
      form
        .validateFields()
        .then((values) => {
          values.document = values.document?.[0]?.originFileObj;
          onFinish(
            {
              ...values,
            },
            newAnnouncement,
            image,
            changedImage
          );
        })
        .catch((info) => {
          console.error("Validate Failed:", info);
        });
    } else {
      onCancel();
    }
  };

  useEffect(() => {
    form.resetFields();
    setValuesChanged(false);
    if (currentAnnounce) {
      currentAnnounce.role = parseInt(currentAnnounce.role);
      form.setFieldsValue(currentAnnounce);
      form.setFieldValue("document", [
        {
          name: currentAnnounce.file_name,
        },
      ]);
      setImage(
        currentAnnounce && currentAnnounce.image ? currentAnnounce.image : null
      );
    } else {
      setImage(null);
    }
  }, [open, currentAnnounce]);

  const setMentorMentees = (partner_id) => {
    var partner_data = partnerOptions.find((x) => x.value === partner_id);
    if (partner_data) {
      setMentees(partner_data.assign_mentees);
      setMentors(partner_data.assign_mentors);
    }
  };

  const changeRole = (val) => {
    setRole(val);
    if (val !== ACCOUNT_TYPE.PARTNER) {
      form.setFieldValue("partner_id", "");
      form.setFieldValue("mentor_id", "");
      form.setFieldValue("mentee_id", "");
      setMentees([]);
      setMentors([]);
    }
  };

  return (
    <Modal
      title="Announcement Editor"
      onOk={onOk}
      onCancel={onCancel}
      open={open}
      confirmLoading={loading}
    >
      <Form
        form={form}
        onValuesChange={handleValuesChange}
        layout="vertical"
        className="update-training-form"
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[
            {
              required: true,
              max: 100,
            },
          ]}
        >
          <Input />
        </Form.Item>
        {newAnnouncement && (
          <Form.Item
            rules={[
              {
                required: false,
              },
            ]}
            name="send_notification"
            valuePropName="checked"
          >
            <Checkbox>Send Notification</Checkbox>
          </Form.Item>
        )}
        <Form.Item
          name="document"
          label="Document"
          rules={[
            {
              required: false,
            },
          ]}
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload accept=".pdf" maxCount={1} beforeUpload={() => false}>
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
        </Form.Item>
        <Form.Item
          name="description"
          label="Training Description"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input.TextArea />
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
            <Button
              icon={<UploadOutlined />}
              className=""
              style={{ marginBottom: "24px" }}
            >
              Upload Image
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
        <Form.Item
          name="role"
          label="Role"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            onChange={(val) => {
              changeRole(val);
            }}
          >
            <Option value={ACCOUNT_TYPE.MENTOR}>Mentor</Option>
            <Option value={ACCOUNT_TYPE.MENTEE}>Mentee</Option>
            <Option value={ACCOUNT_TYPE.PARTNER}>Partner</Option>
            <Option value={ACCOUNT_TYPE.HUB}>Hub</Option>
          </Select>
        </Form.Item>
        {form.getFieldValue("role") === ACCOUNT_TYPE.PARTNER && (
          <Form.Item
            name="partner_id"
            label="Partner"
            rules={[
              {
                required: false,
              },
            ]}
          >
            <Select onChange={(partner_id) => setMentorMentees(partner_id)}>
              <Option value={""}></Option>
              {partnerOptions.map((item) => {
                return <Option value={item.value}>{item.label}</Option>;
              })}
            </Select>
          </Form.Item>
        )}
        {mentors && mentors.length > 0 && (
          <Form.Item
            name="mentor_id"
            label="Mentor"
            rules={[
              {
                required: false,
              },
            ]}
          >
            <Select>
              <Option value={""}></Option>
              {mentors.map((item) => {
                return (
                  <Option value={item.id.$oid ? item.id.$oid : item.id}>
                    {item.name}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        )}
        {mentees && mentees.length > 0 && (
          <Form.Item
            name="mentee_id"
            label="Mentee"
            rules={[
              {
                required: false,
              },
            ]}
          >
            <Select>
              <Option value={""}></Option>
              {mentees.map((item) => {
                return (
                  <Option value={item.id.$oid ? item.id.$oid : item.id}>
                    {item.name}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        )}
        {role === ACCOUNT_TYPE.HUB && (
          <Form.Item
            name="hub_id"
            label="Hub"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select>
              <Option value={""}></Option>
              {hubOptions.map((item) => {
                return <Option value={item.value}>{item.label}</Option>;
              })}
            </Select>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

export default UpdateAnnouncementModal;
