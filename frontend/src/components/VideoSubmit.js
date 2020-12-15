import React from "react";
import { Button, Form, Input, Select } from "antd";
import { SPECIALIZATIONS } from "utils/consts.js";
import { formatDropdownItems } from "utils/inputs";
import "../components/css/Videos.scss";

const VideoSubmit = (props) => {
  return (
    <div
      style={{
        boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
        marginRight: "36px",
        borderRadius: "8px",
      }}
    >
      <div className="video-submit-title">Add Video</div>
      <div className="video-submit-card">
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
            rules={[
              {
                required: true,
                message: "Please input a video title",
              },
            ]}
          >
            <Input placeholder="Video Title" />
          </Form.Item>
          <Form.Item
            name="url"
            rules={[
              {
                required: true,
                message: "Please input a video link",
              },
            ]}
          >
            <Input placeholder="Video Link" />
          </Form.Item>
          <Form.Item
            name="tag"
            rules={[
              {
                required: true,
                message: "Please select a tag",
              },
            ]}
          >
            <Select>{formatDropdownItems(SPECIALIZATIONS)}</Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default VideoSubmit;
