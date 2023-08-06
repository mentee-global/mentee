import { Card, theme } from "antd";
import React from "react";
import { css } from "@emotion/css";
import { RightCircleOutlined } from "@ant-design/icons";

const { Meta } = Card;
const { useToken } = theme;

function SelectCard({ title, description, avatar, onClick, style, rightIcon }) {
  const { token } = useToken();

  const selectCardTitle = () => (
    <div
      className={css`
        display: flex;
        justify-content: space-between;
      `}
    >
      <div>{title}</div>
      {rightIcon ?? <RightCircleOutlined />}
    </div>
  );

  return (
    <Card
      style={{ ...style, width: "100%" }}
      className={css`
        box-shadow: 1px 1px 4px rgba(5, 145, 255, 0.15);
        cursor: pointer;
        user-select: none;
        transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

        :hover {
          border: 1px solid ${token.colorPrimary};
          div {
            transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
            color: ${token.colorPrimary};
          }
        }

        :after {
          content: "";
          display: block;
          position: absolute;
          border-radius: 8px;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.305, 0.045, 0.695, 1);
          box-shadow: 0 0 10px 10px ${token.colorPrimaryHover};
        }

        :active:after {
          box-shadow: 0 0 0 0 ${token.colorPrimaryHover};
          position: absolute;
          border-radius: 8px;
          left: 0;
          top: 0;
          opacity: 1;
          transition: 0s;
        }
      `}
      onClick={() => setTimeout(onClick, 400)}
    >
      <Meta
        avatar={avatar}
        title={selectCardTitle()}
        description={description}
      />
    </Card>
  );
}

export default SelectCard;
