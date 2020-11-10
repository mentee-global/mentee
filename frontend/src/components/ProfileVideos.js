import React from "react";
import { Row, Col } from "antd";

import "./css/PublicProfile.scss";

function ProfileVideos(props) {
  const defaultVideo = <div className="video-default-preview"> </div>;

  return (
    <div>
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
