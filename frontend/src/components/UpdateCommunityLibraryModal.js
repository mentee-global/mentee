import React, { useEffect, useState } from "react";
import { Button, Form, Input, Modal, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { TRAINING_TYPE } from "utils/consts";
import "components/css/Training.scss";

const normFile = (e) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

// TODO: Change the weird names of some of the forms like typee and filee
function UpdateCommunityLibraryModal({
  onCancel,
  onFinish,
  open,
  currentData,
  loading,
}) {
  const [form] = Form.useForm();
  const [valuesChanged, setValuesChanged] = useState(false);
  const newData = !currentData;

  const handleValuesChange = () => {
    setValuesChanged(true);
  };

  const onOk = () => {
    if (valuesChanged) {
      form
        .validateFields()
        .then((values) => {
          values.file = values.file?.[0]?.originFileObj;
          onFinish(
            {
              ...values,
            },
            newData
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
    if (currentData) {
      form.setFieldsValue(currentData);

      form.setFieldValue("file", [
        {
          name: currentData.file_name,
        },
      ]);
    }
  }, [open, currentData]);

  return (
    <Modal
      title="Library Editor"
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
        <Form.Item
          name="file"
          label="File"
          rules={[
            {
              required: true,
            },
          ]}
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload
            accept=".pdf, .doc, .png,.jpg,.jpeg"
            maxCount={1}
            beforeUpload={() => false}
          >
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
      </Form>
    </Modal>
  );
}

export default UpdateCommunityLibraryModal;
