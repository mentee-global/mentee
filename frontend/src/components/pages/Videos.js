import React, { useState, useEffect } from "react";
import {
  Button,
  Form,
  Select,
  Typography,
  Table,
  Space,
  Popconfirm,
} from "antd";
import moment from "moment";
import { useSelector, useDispatch } from "react-redux";
import VideoSubmit from "components/VideoSubmit";
import { updateAndFetchUser } from "features/userSlice";
import { ACCOUNT_TYPE } from "utils/consts.js";
import { useAuth } from "utils/hooks/useAuth";
import "../css/Videos.scss";
import { useTranslation } from "react-i18next";
import { css } from "@emotion/css";
import {
  DeleteOutlined,
  EditOutlined,
  PushpinOutlined,
} from "@ant-design/icons";

function Videos() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [videos, setVideos] = useState([]);
  const [open, setOpen] = useState(false);
  const user = useSelector((state) => state.user.user);
  const options = useSelector((state) => state.options);
  const [form] = Form.useForm();
  const { profileId } = useAuth();

  useEffect(() => {
    if (user) {
      let result = JSON.parse(JSON.stringify(user.videos));
      // Formats all dates from objects (in Epoch) to MongoDB parsable
      result.forEach((video, index) => {
        const date = video.date_uploaded.$date;
        result[index].date_uploaded = moment(date).format();
      });

      const newVideos = result.map((video, index) => ({
        ...video,
        key: index,
      }));
      setVideos(newVideos);
    }
  }, [user]);

  function updateVideos(updates, id) {
    const data = {
      videos: updates,
    };
    dispatch(updateAndFetchUser({ data, id, role: ACCOUNT_TYPE.MENTOR }));
  }

  const handleDeleteVideo = (video) => {
    let newVideos = [...videos];
    let id = newVideos.indexOf(video);
    newVideos.splice(id, 1);
    updateVideos(newVideos, profileId);
  };

  const handleVideoTag = (id, specialization) => {
    const newVideos = [...videos];
    const video = {
      ...newVideos[id],
      tag: specialization,
    };
    newVideos[id] = video;
    updateVideos(newVideos, profileId);
  };

  const handlePinVideo = (id) => {
    const newVideos = [...videos];
    const video = newVideos.splice(id, 1)[0];
    newVideos.sort(
      (a, b) => moment(a.date_uploaded).diff(moment(b.date_uploaded)) * -1
    );
    newVideos.unshift(video);
    updateVideos(newVideos, profileId);
  };

  const handleSubmitVideo = () => {
    form.validateFields().then((values) => {
      let newVideo = {
        ...values,
        date_uploaded: moment().format(),
        tag: values.tag,
        key: videos.length,
      };
      const newVideos = [...videos, newVideo];
      updateVideos(newVideos, profileId);
      form.resetFields();
      setOpen(false);
    });
  };

  const columns = [
    {
      title: t("mentorVideoPage.videoTitle"),
      dataIndex: "title",
      key: "title",
      render: (_, record) => (
        <a href={record.url} target="_blank" rel="noreferrer">
          {record.title}
        </a>
      ),
    },
    {
      title: t("mentorVideoPage.specializationTag"),
      dataIndex: "tag",
      key: "tag",
      render: (_, record) => (
        <Select
          placeholder={t("common.specializations")}
          onChange={(value) => handleVideoTag(record.key, value)}
          value={record.tag}
          className={css`
            width: 200px;
          `}
          options={options.specializations}
        />
      ),
    },
    {
      title: <EditOutlined />,
      dataIndex: "actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<PushpinOutlined />}
            shape="circle"
            type={record.key === 0 ? "primary" : "default"}
            onClick={() => handlePinVideo(record.key)}
          />
          <Popconfirm
            title={t("common.delete")}
            description="Are you sure to delete this?"
            onConfirm={() => handleDeleteVideo(record)}
            okText={t("common.yes")}
            cancelText={t("common.no")}
          >
            <Button icon={<DeleteOutlined />} danger shape="circle" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div
      className={css`
        margin: 32px;
      `}
    >
      <VideoSubmit
        setOpen={setOpen}
        open={open}
        form={form}
        handleSubmitVideo={handleSubmitVideo}
      />
      <Typography.Title level={2}>{t("sidebars.videos")}</Typography.Title>
      <Button
        type="primary"
        className={css`
          margin-bottom: 16px;
        `}
        onClick={() => setOpen(true)}
      >
        {t("mentorVideoPage.addVideo")}
      </Button>
      <Table columns={columns} dataSource={videos} />
    </div>
  );
}

export default Videos;
