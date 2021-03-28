import React, { useState } from "react";
import { Input, Typography, Result, Spin } from "antd";
import { getIsEmailVerified } from "../../utils/api";

const { Search } = Input;
const { Title } = Typography;

function AdminVerifiedEmails() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const onSearch = async (email) => {
    if (!email) {
      setStatus("");
      return;
    }
    setLoading(true);
    const res = await getIsEmailVerified(email);

    if (res && res.is_verified) {
      setStatus("success");
    } else {
      setStatus("error");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <Title level={3}>Search For Verified Emails</Title>
      <Search
        placeholder="Email Search"
        onSearch={onSearch}
        allowClear
        style={{ width: 400 }}
      />
      <Spin spinning={loading}>
        {!status ? <Result /> : <Result status={status} />}
      </Spin>
    </div>
  );
}

export default AdminVerifiedEmails;
