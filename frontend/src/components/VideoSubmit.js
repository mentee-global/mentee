import React from "react";
import { Form, Input, Modal, Select } from "antd";
import { useSelector } from "react-redux";

import "../components/css/Videos.scss";
import ReactPlayer from "react-player";
import { useTranslation } from "react-i18next";

const VideoSubmit = ({ form, handleSubmitVideo, open, setOpen }) => {
  const { t } = useTranslation();
  const options = useSelector((state) => state.options);
  return (
    <Modal
      open={open}
      title={t("mentorVideoPage.addVideo")}
      okText={t("common.submit")}
      onOk={handleSubmitVideo}
      cancelText={t("common.cancel")}
      onCancel={() => {
        setOpen(false);
        form.resetFields();
      }}
    >
      <Form
        form={form}
        name="video-submit"
        initialValues={{
          remember: true,
        }}
      >
        <Form.Item
          name="title"
          className="video-submit-input"
          rules={[
            {
              required: true,
              message: t("mentorVideoPage.videoTitleValidate"),
            },
          ]}
        >
          <Input placeholder={t("mentorVideoPage.videoTitle")} />
        </Form.Item>
        <Form.Item
          name="url"
          className="video-submit-input"
          rules={[
            {
              required: true,
              message: t("common.invalidUrl"),
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || ReactPlayer.canPlay(getFieldValue("url"))) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Invalid URL"));
              },
            }),
          ]}
        >
          <Input placeholder={t("mentorVideoPage.videoLink")} />
        </Form.Item>
        <Form.Item
          name="tag"
          className="video-submit-input"
          rules={[
            {
              required: true,
              message: t("mentorVideoPage.videoTagValidate"),
            },
          ]}
        >
          <Select
            placeholder={t("common.specializations")}
            className="video-submit-input"
            options={options.specializations}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default VideoSubmit;
