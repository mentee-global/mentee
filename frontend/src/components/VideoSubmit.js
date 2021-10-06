import React from "react";
import { Button, Form, Input, Select } from "antd";
import { SPECIALIZATIONS } from "utils/consts.js";
import { formatDropdownItems } from "utils/inputs";
import "../components/css/Videos.scss";
import {matchYoutubeUrl, validateVimeoURL} from "utils/misc.js";

const VideoSubmit = (props) => {
  return (
    <div className="video-submit-card">
      <div className="video-submit-title">Add Video</div>
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
                message: "Please input a video title",
              },
            ]}
          >
            <Input placeholder="Video Title (e.g. 'Welcome!', 'How to do taxes')" />
          </Form.Item>
          <Form.Item
            name="url"
            className="video-submit-input"
            rules={[
              {
                required: true,
                message: "Please input valid a Youtube or Vimeo link",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || matchYoutubeUrl(getFieldValue('url')) || validateVimeoURL(getFieldValue('url'))) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Please input valid a Youtube or Vimeo link'));
                },
              }),
            ]}
          >
            <Input placeholder="Video Link" />
          </Form.Item>
          <Form.Item
            name="tag"
            className="video-submit-input"
            rules={[
              {
                required: true,
                message: "Please select a tag",
              },
            ]}
          >
            <Select
              placeholder="Specializations"
              className="video-submit-input"
            >
              {formatDropdownItems(SPECIALIZATIONS)}
            </Select>
          </Form.Item>
          <Form.Item className="video-submit-input">
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
