import React, { useEffect, useState } from "react";
import { getDetailMessages, getMessageData } from "utils/api";
import { Table, Input, Avatar, Spin, DatePicker, Modal } from "antd";
import {
  CloseCircleFilled,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Tab } from "@material-ui/core";

export const AdminMessages = () => {
  const { RangePicker } = DatePicker;
  const [totalLength, setTotalLength] = useState();
  const [modalData, setModalData] = useState([]);
  const [data, setData] = useState([]);
  const [selectedRow, setSelectedRow] = useState();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const [reload, setReload] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setpageNumber] = useState(1);
  const [startDate, setStartDate] = useState("2010-01-01");
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const pageSize = 10;
  const columns = [
    {
      title: "Mentor",
      sorter: (a, b) => (a.name < b.name ? -1 : 1),
      dataIndex: "user",
      key: "user",
      render: (value) => (
        <div>
          <Avatar
            size={30}
            icon={<UserOutlined />}
            className="modal-profile-icon2"
            src={value.image ? value.image.url : ""}
          />
          <div>{value.name}</div>
        </div>
      ),
    },
    {
      title: "Mentee",
      sorter: (a, b) => (a.name < b.name ? -1 : 1),
      dataIndex: "otherUser",
      key: "otherUser",
      render: (value) => (
        <div>
          <Avatar
            size={30}
            icon={<UserOutlined />}
            className="modal-profile-icon2"
            src={value.image ? value.image : ""}
          />
          <div>{value.name}</div>
        </div>
      ),
    },
    {
      title: "Messages Number",
      sorter: (a, b) => (a < b ? -1 : 1),
      dataIndex: "numberOfMessages",
      key: "numberOfMessages",
      render: (value) => <a>{value}</a>,
    },
    {
      title: "Latest Message Body",
      dataIndex: "latestMessage",
      key: "body",
      render: (value) => <a>{value.body}</a>,
    },
    {
      title: "Latest Message Date",
      sorter: (a, b) => (a.created_at?.$date < b.created_at?.$date ? -1 : 1),
      dataIndex: "latestMessage",
      key: "date",
      render: (value) => (
        <a>{new Date(value.created_at.$date).toDateString()}</a>
      ),
    },
  ];
  const modalColumns = [
    {
      title: "Message Body",
      dataIndex: "body",
      key: "numberOfMessages",
      render: (value) => <a>{value}</a>,
    },
    {
      title: "Message Date",
      dataIndex: "created_at",
      key: "date",
      render: (value) => <a>{new Date(value.$date).toDateString()}</a>,
    },
    {
      title: "Sender",
      dataIndex: "recipient_id",
      key: "date",
      render: (value) => (
        <a>{value.$oid === selectedRow.otherId ? "Mentor" : "Mentee"}</a>
      ),
    },
  ];
  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      let { data: dataa, total_length } = await getDetailMessages(
        pageNumber,
        pageSize,
        searchTerm,
        startDate,
        endDate
      );
      if (dataa) {
        console.log(total_length);
        setTotalLength(total_length);
        setData(dataa);
        setLoading(false);
      } else {
        setErr(true);
        setLoading(false);
      }
    };
    getData();
  }, [reload, searchTerm, startDate, endDate, pageNumber]);
  const { Search } = Input;
  return (
    <div className="trains">
      <div className="rolesContainer flex-column-cnt">
        <Search
          placeholder="Search Mentor by name"
          // value={searchTerm}
          onSearch={(e) => {
            setSearchTerm(e);
          }}
          className="search-mentor-input"
          allowClear
        />
        <RangePicker
          onChange={(date, dateString) => {
            console.log(date, dateString);
            if (dateString[0] === "" && dateString[1] === "") {
              setEndDate(new Date().toISOString().split("T")[0]);
              setStartDate("2010-01-01");
            } else {
              setStartDate(dateString[0]);
              setEndDate(dateString[1]);
            }
          }}
          className="messages-date-range"
        />
      </div>
      {loading ? (
        <Spin />
      ) : (
        <div className="trainTable">
          <Table
            columns={columns}
            onRow={(record, rowIndex) => {
              return {
                onClick: (event) => {
                  setSelectedRow(data[rowIndex]);
                  setShowModal(true);
                  getMessageData(
                    data[rowIndex].user._id.$oid,
                    data[rowIndex].otherId
                  ).then((messages) => {
                    setModalData(messages);
                  });
                }, // click row
              };
            }}
            dataSource={data}
            pagination={{
              pageSize: pageSize,
              defaultCurrent: 1,
              pageNumber: pageNumber,
              current: pageNumber,
              total: totalLength,
              onChange: (page, pageSize) => {
                setpageNumber(page);
                console.log(page, pageSize);
              },
            }}
          />
          ;
        </div>
      )}
      <Modal
        title=""
        visible={showModal}
        onCancel={() => {
          setShowModal(false);
        }}
        footer={<></>}
        width={"800px"}
      >
        <div style={{ padding: "30px" }}>
          <div className="flex-column-cnt">
            <div>
              <Avatar
                size={30}
                icon={<UserOutlined />}
                className="modal-profile-icon2"
                src={selectedRow?.user.image ? selectedRow?.user.image.url : ""}
              />
              <a
                style={{ display: "block", color: "black" }}
                target="_blank"
                rel="noopener noreferrer"
                href={`http://localhost:3000/gallery/1/${selectedRow?.user._id.$oid}`}
              >
                {selectedRow?.user.name}
              </a>
            </div>
            <div>
              <Avatar
                size={30}
                icon={<UserOutlined />}
                className="modal-profile-icon2"
                src={
                  selectedRow?.otherUser.image
                    ? selectedRow?.otherUser.image.url
                    : ""
                }
              />
              <a
                target="_blank"
                style={{ display: "block", color: "black" }}
                rel="noopener noreferrer"
                href={`http://localhost:3000/gallery/2/${selectedRow?.otherId}`}
              >
                {selectedRow?.otherUser.name}
              </a>
            </div>
          </div>
          <h1>Messages</h1>
          <Table columns={modalColumns} dataSource={modalData} />
        </div>
      </Modal>
    </div>
  );
};
