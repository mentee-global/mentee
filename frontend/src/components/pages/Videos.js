import React from "react";
import { Row, Col, Button, Form, Input, Select } from "antd";
import "../css/Videos.scss";
const { Option } = Select;

function Videos() {
  return (
    <div style={{ height: "100%" }}>
      <div class="videos-header">
        <h1 class="videos-header-title">Welcome, {"Insert name"}</h1>
        <Button className="edit-videos" shape="round" size="large">
          Manage Uploads
        </Button>
      </div>
      <div className="filter-card">
        <h1>Your Uploads</h1>
        <div className="filters">
          <Input.Search></Input.Search>
          <Select>
            <Option>First</Option>
            <Option>Second</Option>
            <Option>Third</Option>
          </Select>
        </div>
      </div>
      <Row>
        <Col span={16}>
          <div className="videos-container">hello</div>
        </Col>
        <Col span={8}>
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
        </Col>
      </Row>
    </div>
  );
}

export default Videos;
