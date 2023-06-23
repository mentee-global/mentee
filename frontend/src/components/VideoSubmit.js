import React from "react";
import { Button, Form, Input, Select } from "antd";
import { useSelector } from "react-redux";

import "../components/css/Videos.scss";
import ReactPlayer from "react-player";
import { useTranslation } from "react-i18next";

const VideoSubmit = (props) => {
  const { t } = useTranslation();
  const options = useSelector((state) => state.options);
  return (
    <div className="video-submit-card">
      <div className="video-submit-title">{t("mentorVideoPage.addVideo")}</div>
      <div
        style={{
          padding: "16px",
        }}
      >
        <Form
          form={props.form}
          name="video-submit"
          initialValues={{
            remember: true,
          }}
          onFinish={props.handleSubmitVideo}
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
                message: t("mentorVideoPage.videoLinkValidate"),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || ReactPlayer.canPlay(getFieldValue("url"))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(t("mentorVideoPage.videoLinkValidate"))
                  );
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
          <Form.Item className="video-submit-input">
            <Button type="primary" htmlType="submit">
              {t("common.submit")}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default VideoSubmit;
