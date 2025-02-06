import React, { useEffect, useState } from "react";
import { withRouter } from "react-router-dom";
import { Button, Upload, Form, Input } from "antd";
import { useTranslation } from "react-i18next";
import { ACCOUNT_TYPE } from "../utils/consts";

import ImgCrop from "antd-img-crop";
import { UploadOutlined } from "@ant-design/icons";

function HubForm({ email, onSubmit, profileData, resetFields }) {
  const { t, i18n } = useTranslation();
  const [image, setImage] = useState(null);
  const [changedImage, setChangedImage] = useState(false);
  const [edited, setEdited] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (profileData) {
      form.setFieldsValue(profileData);
      setImage(profileData.image);
    }
  }, [profileData, form, resetFields]);

  const onFinish = async (values) => {
    let newData = values;
    if (email) {
      newData.email = email;
    }
    newData.role = ACCOUNT_TYPE.HUB;
    newData.preferred_language = i18n.language;
    newData.image = image;
    newData.changedImage = changedImage;
    newData.edited = edited;
    onSubmit(newData);
    setChangedImage(false);
    setEdited(false);
  };

  return (
    <Form
      form={form}
      onFinish={onFinish}
      layout="vertical"
      style={{ width: "100%", marginTop: "1em" }}
      onValuesChange={() => setEdited(true)}
    >
      <Form.Item
        name="name"
        rules={[
          {
            required: true,
            message: t("common.requiredFullName"),
          },
        ]}
      >
        <Input type="text" className="" bordered={true} placeholder={"Name"} />
      </Form.Item>
      <Form.Item
        name="email"
        rules={[
          {
            required: true,
            message: "Please input Email.",
          },
          {
            type: "email",
            message: "The input is not valid E-mail!",
          },
        ]}
      >
        <Input bordered={true} placeholder={"Email"} value={email} readOnly />
      </Form.Item>
      <Form.Item
        name="url"
        rules={[
          {
            required: true,
            message: "Please input URL.",
          },
        ]}
      >
        <Input addonBefore="URL" readOnly />
      </Form.Item>
      <ImgCrop
        rotate
        fillColor={"transparent"}
        aspect={5 / 3}
        minZoom={0.2}
        cropperProps={{ restrictPosition: false }}
      >
        <Upload
          onChange={async (file) => {
            setImage(file.file.originFileObj);
            setChangedImage(true);
          }}
          accept=".png,.jpg,.jpeg"
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />} className="">
            {"Upload Logo"}
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
      <Form.Item>
        <Button
          className="regular-button"
          htmlType="submit"
          style={{ marginTop: "20px" }}
        >
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}

export default withRouter(HubForm);
