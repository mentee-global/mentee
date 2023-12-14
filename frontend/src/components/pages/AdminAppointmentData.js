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
