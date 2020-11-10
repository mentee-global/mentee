import React from "react";
import { Row, Col, Button, Form, Input } from "antd";
import "../css/Videos.scss";

function Videos() {
  return (
    <div style={{ height: "100%" }}>
      <div class="videos-header">
        <h1 class="videos-header-title">Welcome, {"Insert name"}</h1>
        <Button className="edit-videos" shape="round" size="large">
          Manage Uploads
        </Button>
      </div>
      <Row>
        <Col span={16}>Hello</Col>
        <div className="video-submit-card">
          <h1 className="video-submit-title">Add Videos</h1>
          <Form
            name="video-submit"
            initialValues={{
              remember: true,
            }}
          >
            <Form.Item
              name="url"
              rules={[
                {
                  required: true,
                  message: "Please input a video link",
                },
              ]}
            >
              <Input placeholder="Paste Link" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Row>
    </div>
  );
}

export default Videos;
