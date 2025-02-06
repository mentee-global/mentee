import React, { useState, useEffect } from "react";
import moment from "moment";
import { Breadcrumb, Input, Button, Row, Col, Spin } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { UserOutlined } from "@ant-design/icons";
import {
  fetchAllAppointments,
  downloadAllApplicationData,
  getDisplaySpecializations,
} from "utils/api";
import { SortByDateDropdown, SpecializationsDropdown } from "../AdminDropdowns";
import AdminAppointmentCard from "../AdminAppointmentCard";
import AdminAppointmentModal from "components/AdminAppointmentModal";
import "../css/AdminAppointments.scss";
import { useAuth } from "utils/hooks/useAuth";
import { Menu, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";

const keys = {
  ASCENDING: 0,
  DESCENDING: 1,
};

function AdminAppointmentData() {
  const [isLoading, setIsLoading] = useState(false);
  const [resetFilters, setResetFilters] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [render, setRender] = useState(false);
  const [isDownloadingAppointments, setIsDownloadingAppointments] =
    useState(false);
  const [downloadFile, setDownloadFile] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [specMasters, setSpecMasters] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [searchTopicIndex, setSearchTopicIndex] = useState(false);
  const [numbersInPage, setNumbersInPage] = useState(10);
  const [pageNum, setPageNum] = useState(1);
  const [pageItems, setPageItems] = useState([]);

  const numbers_in_page_options = [
    { key: 10, value: 10 },
    { key: 20, value: 20 },
    { key: 50, value: 50 },
  ];

  const overlay = (
    <Menu>
      {numbers_in_page_options.map((option_item) => {
        return (
          <Menu.Item>
            <a href="#" onClick={() => setNumbersInPage(option_item.value)}>
              {option_item.value}
            </a>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  const { onAuthStateChanged } = useAuth();

  useEffect(() => {
    async function getAppointments() {
      setIsLoading(true);
      const res = await fetchAllAppointments();

      if (res) {
        const sorted = res.appointments.reverse();
        setAppointments(sorted);
        setFilterData(sorted);
      }
      setIsLoading(false);
    }

    onAuthStateChanged(getAppointments);

    async function getMasters() {
      setSpecMasters(await getDisplaySpecializations());
    }
    getMasters();
  }, []);

  useEffect(() => {
    setPageNum(1);
    var res_items = [];
    var all_data = appointments;
    if (searchName) {
      all_data = all_data.filter((appt) => {
        return (
          appt.mentor.match(new RegExp(searchName, "i")) ||
          appt.appointment.name.match(new RegExp(searchName, "i"))
        );
      });
    }
    if (searchTopicIndex !== false) {
      all_data = all_data.filter((appt) => {
        if (appt.appointment.topic) {
          return appt.appointment.topic === specMasters[searchTopicIndex].value;
        } else {
          return appt.appointment.specialist_categories
            .join(", ")
            .includes(specMasters[searchTopicIndex].value);
        }
      });
    }

    if (all_data && all_data.length > 0) {
      for (
        var i = numbersInPage * (pageNum - 1);
        i < Math.min(numbersInPage * pageNum, all_data.length);
        i++
      ) {
        res_items.push(all_data[i]);
      }
    }
    var temp = [];
    const visiblePageRange = 2;
    for (var j = 1; j <= Math.ceil(all_data.length / numbersInPage); j++) {
      if (
        j === 1 ||
        j === Math.ceil(all_data.length / numbersInPage) ||
        (j >= pageNum - visiblePageRange && j <= pageNum + visiblePageRange)
      ) {
        temp.push(j);
      } else if (temp[temp.length - 1] !== "...") {
        temp.push("...");
      }
    }
    setPageItems(temp);
    setFilterData(res_items);
  }, [
    numbersInPage,
    pageNum,
    searchName,
    searchTopicIndex,
    appointments,
    specMasters,
  ]);

  const handleSearchAppointment = (searchValue) => {
    setSearchName(searchValue);
    var filter_data = appointments;
    if (searchValue) {
      filter_data = filter_data.filter((appt) => {
        return (
          appt.mentor.match(new RegExp(searchValue, "i")) ||
          appt.appointment.name.match(new RegExp(searchValue, "i"))
        );
      });
    }
    if (searchTopicIndex !== false) {
      filter_data = filter_data.filter((appt) => {
        if (appt.appointment.topic) {
          return appt.appointment.topic === specMasters[searchTopicIndex].value;
        } else {
          return appt.appointment.specialist_categories
            .join(", ")
            .includes(specMasters[searchTopicIndex].value);
        }
      });
    }
    setFilterData(filter_data);
  };

  const handleResetFilters = () => {
    setSearchTopicIndex(false);
    setFilterData(appointments);
    setResetFilters(!resetFilters);
  };
  const handleSortData = (sortingKey) => {
    const isAscending = sortingKey === keys.ASCENDING;
    const newSorted = filterData.sort((a, b) => {
      const aDate = moment(a.appointment.timeslot.start_time.$date);
      const bDate = moment(b.appointment.timeslot.start_time.$date);
      return isAscending ? bDate.diff(aDate) : aDate.diff(bDate);
    });
    setFilterData(newSorted);
    setRender(!render);
  };
  // TODO: This is probably a broken function
  const handleSpecializationsDisplay = (index) => {
    setSearchTopicIndex(index);
    var newFiltered = appointments.filter((appt) => {
      if (appt.appointment.topic) {
        return appt.appointment.topic === specMasters[index].value;
      } else {
        return appt.appointment.specialist_categories
          .join(", ")
          .includes(specMasters[index].value);
      }
    });
    if (searchName) {
      newFiltered = newFiltered.filter((appt) => {
        return (
          appt.mentor.match(new RegExp(searchName, "i")) ||
          appt.appointment.name.match(new RegExp(searchName, "i"))
        );
      });
    }

    setFilterData(newFiltered);
  };

  const handleAppointmentDownload = async () => {
    setIsDownloadingAppointments(true);
    const file = await downloadAllApplicationData();
    setDownloadFile(file);
    setIsDownloadingAppointments(false);
  };

  const handleAppointmentClick = (appointmentData) => {
    setSelectedAppointment(appointmentData);
    setVisible(true);
  };

  const handleCloseModal = () => {
    setVisible(false);
  };

  const movePageItem = (index) => {
    if (pageNum + index === 0 || pageNum + index > pageItems.length) return;
    setPageNum(pageNum + index);
  };

  return (
    <div className="appointments-body">
      {selectedAppointment && (
        <AdminAppointmentModal
          open={visible}
          data={selectedAppointment.data}
          dateFormat={selectedAppointment.dateFormat}
          status={selectedAppointment.status}
          onClose={handleCloseModal}
        />
      )}
      <div style={{ display: "none" }}>
        <iframe src={downloadFile} />
      </div>
      <Breadcrumb>
        <Breadcrumb.Item>User Reports</Breadcrumb.Item>
        <Breadcrumb.Item>
          <a href="all-appointments">All Appointments</a>
        </Breadcrumb.Item>
      </Breadcrumb>
      <div className="table-header">
        <div className="appointment-search">
          <Input.Search
            placeholder="Search by name"
            prefix={<UserOutlined />}
            allowClear
            size="medium"
            onSearch={(value) => handleSearchAppointment(value)}
          />
        </div>

        <div style={{ lineHeight: "30px" }}>
          <label style={{ marginRight: "10px" }}>Numbers of Display</label>
          <Dropdown overlay={overlay} className={""} trigger={["click"]}>
            <a href="#" style={{ color: "black" }}>
              {numbersInPage} <DownOutlined />
            </a>
          </Dropdown>
        </div>

        <div>
          <ul class="custom-ant-pagination ant-table-pagination">
            <li
              title="Previous Page"
              class={
                "ant-pagination-prev " +
                (pageNum === 1 ? "ant-pagination-disabled" : "")
              }
            >
              <button
                class="ant-pagination-item-link"
                type="button"
                tabindex="-1"
                onClick={() => movePageItem(-1)}
              >
                <span role="img" aria-label="left" class="anticon anticon-left">
                  <svg
                    viewBox="64 64 896 896"
                    focusable="false"
                    data-icon="left"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 000 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path>
                  </svg>
                </span>
              </button>
            </li>
            {pageItems.map((index) => {
              return (
                <li
                  class={
                    "ant-pagination-item " +
                    (pageNum === index ? "ant-pagination-item-active" : "")
                  }
                >
                  <a
                    href="#"
                    onClick={() => {
                      if (index !== pageNum && parseInt(index) > 0) {
                        setPageNum(index);
                      }
                    }}
                  >
                    {index}
                  </a>
                </li>
              );
            })}
            <li
              title="Next Page"
              tabindex="0"
              class={
                "ant-pagination-next " +
                (pageNum === pageItems.length ? "ant-pagination-disabled" : "")
              }
            >
              <button
                class="ant-pagination-item-link"
                type="button"
                tabindex="-1"
                onClick={() => movePageItem(1)}
              >
                <span
                  role="img"
                  aria-label="right"
                  class="anticon anticon-right"
                >
                  <svg
                    viewBox="64 64 896 896"
                    focusable="false"
                    data-icon="right"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z"></path>
                  </svg>
                </span>
              </button>
            </li>
          </ul>
        </div>

        <div className="table-button-group">
          <SpecializationsDropdown
            className="table-button"
            onChange={(key) => handleSpecializationsDisplay(key)}
            onReset={resetFilters}
          />
          <SortByDateDropdown
            className="table-button"
            onChange={(key) => handleSortData(key)}
            onReset={resetFilters}
          />
          <Button className="table-button" onClick={() => handleResetFilters()}>
            Clear Filters
          </Button>
          <Button
            className="table-button"
            icon={<DownloadOutlined />}
            onClick={() => handleAppointmentDownload()}
            loading={isDownloadingAppointments}
          >
            Appointment Data
          </Button>
        </div>
      </div>
      <Spin spinning={isLoading} size="large" style={{ height: "100vh" }}>
        <div className="appointments-table">
          <Row gutter={[16, 16]} justify="start">
            {filterData.map((data, key) => {
              return (
                <Col span={6} key={key}>
                  <AdminAppointmentCard
                    data={data}
                    render={render}
                    onClick={handleAppointmentClick}
                  />
                </Col>
              );
            })}
          </Row>
        </div>
      </Spin>
    </div>
  );
}

export default AdminAppointmentData;
