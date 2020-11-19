import React, { useState, useEffect } from "react";
import { Row, Col, Button, Form, Input, Select } from "antd";
import { DeleteOutlined, PushpinOutlined } from "@ant-design/icons";
import moment from "moment";
import { SPECIALIZATIONS } from "utils/consts.js";
import "../css/Videos.scss";
import videosJSON from "utils/videos.json";
const { Option } = Select;

function Videos() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    async function getVideos() {
      setVideos(videosJSON.data.videos);
    }
    getVideos();
    console.log(videos);
  }, []);

  const handleDeleteVideo = (id) => {
    const newVideos = [...videos];
    newVideos.splice(id, 1);
    setVideos(newVideos);
  };

  const handleVideoTag = (id, specialization) => {
    const newVideos = [...videos];
    const video = {
      ...newVideos[id],
      tag: specialization,
    };
    newVideos[id] = video;
    setVideos(newVideos);
  };

  const returnDropdownItems = (items) => {
    let options = [];
    for (let i = 0; i < items.length; i++) {
      options.push(<Option key={i}>{items[i]}</Option>);
    }
    return options;
  };

  const Video = (props) => {
    return (
      <div className="video-row">
        <div className="video-block">
          <div className="video"></div>
          <div className="video-description">
            <div>{props.title}</div>
            <div>{moment(props.date).fromNow()}</div>
          </div>
          <div className="video-pin">
            <button>
              <PushpinOutlined />
            </button>
          </div>
        </div>
        <div className="video-interactions">
          <Select
            style={{ ...styles.interactionVideo, left: "14%", width: 230 }}
            defaultValue={props.tag}
            onChange={(option) =>
              props.onChangeTag(props.id, SPECIALIZATIONS[option])
            }
          >
            {returnDropdownItems(SPECIALIZATIONS)}
          </Select>
          <Button
            icon={
              <DeleteOutlined style={{ fontSize: "24px", color: "#957520" }} />
            }
            style={{ ...styles.interactionVideo, left: "78%" }}
            type="text"
            onClick={() => handleDeleteVideo(props.id)}
          ></Button>
        </div>
      </div>
    );
  };

  const VideosContainer = () => {
    return (
      <div className="videos-container">
        <div className="videos-table-title">
          <h1>Specializations Tag</h1>
          <h1>Delete</h1>
        </div>
        {videos &&
          videos.map((values, index) => (
            <Video
              title={values.title}
              date={values.date_uploaded}
              tag={values.tag}
              id={index}
              onChangeTag={handleVideoTag}
            />
          ))}
      </div>
    );
  };

  return (
    <div style={{ height: "100%" }}>
      <div className="videos-header">
        <h1 className="videos-header-title">Welcome, {"Insert name"}</h1>
        <Button className="edit-videos" shape="round" size="large">
          Manage Uploads
        </Button>
      </div>
      <div className="filter-card">
        <h1 style={{ fontWeight: "bold", fontSize: 18 }}>Your Uploads</h1>
        <div className="filters">
          <Input.Search style={{ width: 300 }}></Input.Search>
          <Select style={{ width: 200 }}>
            {returnDropdownItems(SPECIALIZATIONS)}
          </Select>
        </div>
      </div>
      <Row>
        <Col span={16}>
          <VideosContainer></VideosContainer>
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

const styles = {
  interactionVideo: {
    position: "absolute",
    top: "50%",
    margin: "-25px 0 0 -25px",
  },
};

export default Videos;
