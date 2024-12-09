import React, { useEffect, useState } from "react";
import { Button, Form, Input, Modal, Select, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { ACCOUNT_TYPE } from "utils/consts";
import "components/css/Training.scss";

const { Option } = Select;

const normFile = (e) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

// TODO: Change the weird names of some of the forms like typee and filee
function AddPolicyModal({ onCancel, onFinish, open, loading, hubOptions }) {
  const [form] = Form.useForm();
  const [isNewDocument, setIsNewDocument] = useState(false);
  const [valuesChanged, setValuesChanged] = useState(false);
  const [role, setRole] = useState(null);

  const handleValuesChange = (changedValues, allValues) => {
    setIsNewDocument(true);
    setValuesChanged(true);
  };

  const onOk = () => {
    if (valuesChanged) {
      form
        .validateFields()
        .then((values) => {
          values.document = values.document?.[0]?.originFileObj;
          onFinish({
            ...values,
            isNewDocument,
          });
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
  }, []);

  return (
    <Modal
      title="Add Policy Document"
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
          label="Document Name"
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

        <Form.Item
          name="description"
          label="Description"
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

export default AddPolicyModal;
