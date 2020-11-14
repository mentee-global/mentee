import React, { useEffect, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Input, Row, Col } from "antd";

import "./css/PublicProfile.scss";

function ProfileVideos(props) {
  const [search, setSearch] = useState("");

  // get videos from props.mentor, useEffect to initialize display

  const defaultVideo = <div className="video-default-preview"> </div>;

  return (
    <div>
      <h1>
        <b>Videos</b>
      </h1>
      <hr className="mentor-profile-videos-divider" />
      {/* Temporary display to show search updating */}
      You searched for: {search}
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mentor-profile-videos-search"
      />
      <Row>
        <Col span={24}>
          <div className="pinned-video-default-preview"> </div>
        </Col>
      </Row>
      <br />
      <Row gutter={16}>
        <Col span={12}>{defaultVideo}</Col>
        <Col span={12}>{defaultVideo}</Col>
      </Row>
      <br />
      <Row gutter={16}>
        <Col span={12}>{defaultVideo}</Col>
        <Col span={12}>{defaultVideo}</Col>
      </Row>
      <br />
      <Row gutter={16}>
        <Col span={12}>{defaultVideo}</Col>
        <Col span={12}>{defaultVideo}</Col>
      </Row>
    </div>
  );
}

export default ProfileVideos;
