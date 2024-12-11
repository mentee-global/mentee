import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Upload,
  Checkbox,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { TRAINING_TYPE, ACCOUNT_TYPE } from "utils/consts";
import "components/css/Training.scss";

const { Option } = Select;

const normFile = (e) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

// TODO: Change the weird names of some of the forms like typee and filee
function UpdateTrainingModal({
  onCancel,
  onFinish,
  open,
  currentTraining,
  loading,
  hubOptions,
}) {
  const [form] = Form.useForm();
  const [trainingType, setTrainingType] = useState("");
  const [isNewDocument, setIsNewDocument] = useState(false);
  const [valuesChanged, setValuesChanged] = useState(false);
  const [role, setRole] = useState(null);
  const newTraining = !currentTraining;

  const handleValuesChange = (changedValues, allValues) => {
    if (changedValues.typee) {
      setTrainingType(changedValues.typee);
    } else if (changedValues.document) {
      setIsNewDocument(true);
    }
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
              isNewDocument,
              isVideo: values.typee !== TRAINING_TYPE.DOCUMENT,
            },
            newTraining
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
    setIsNewDocument(false);
    setTrainingType(TRAINING_TYPE.VIDEO);
    if (currentTraining) {
      setTrainingType(currentTraining.typee);
      currentTraining.role = parseInt(currentTraining.role);
      form.setFieldsValue(currentTraining);

      if (currentTraining.typee === TRAINING_TYPE.DOCUMENT) {
        form.setFieldValue("document", [
          {
            name: currentTraining.file_name,
          },
        ]);
      }
    }
  }, [open, currentTraining]);

  return (
    <Modal
      title="Training Editor"
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
          label="Training Name"
          rules={[
            {
              required: true,
              max: 100,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="typee"
          label="Training Type"
          initialValue={TRAINING_TYPE.VIDEO}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Radio.Group>
            <Radio value={TRAINING_TYPE.VIDEO}>Video</Radio>
            <Radio value={TRAINING_TYPE.DOCUMENT}> Document </Radio>
            <Radio value={TRAINING_TYPE.LINK}> External Link </Radio>
          </Radio.Group>
        </Form.Item>
        {form.getFieldValue("typee") === TRAINING_TYPE.DOCUMENT && (
          <Form.Item
            rules={[
              {
                required: false,
              },
            ]}
            name="requried_sign"
            valuePropName="checked"
          >
            <Checkbox>Required Sign</Checkbox>
          </Form.Item>
        )}
        {newTraining && (
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
        {trainingType === TRAINING_TYPE.DOCUMENT ? (
          <Form.Item
            name="document"
            label="Document"
            rules={[
              {
                required: true,
              },
            ]}
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload accept=".pdf" maxCount={1} beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
          </Form.Item>
        ) : (
          <Form.Item
            name="url"
            label="URL"
            rules={[
              {
                required: true,
                type: "url",
              },
            ]}
          >
            <Input />
          </Form.Item>
        )}
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
        <Form.Item
          name="role"
          label="Role"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select onChange={(val) => setRole(val)}>
            <Option value={ACCOUNT_TYPE.MENTOR}>Mentor</Option>
            <Option value={ACCOUNT_TYPE.MENTEE}>Mentee</Option>
            <Option value={ACCOUNT_TYPE.PARTNER}>Partner</Option>
            <Option value={ACCOUNT_TYPE.HUB}>Hub</Option>
          </Select>
        </Form.Item>
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

export default UpdateTrainingModal;
