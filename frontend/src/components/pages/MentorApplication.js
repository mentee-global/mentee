import React, { useEffect, useState } from "react";
import { Steps, message, Form, Input, Radio, Row, Col} from 'antd';
import MenteeButton from "../MenteeButton";
import ModalInput from "../ModalInput";

function MentorApplication() { 
    const { Step } = Steps;
    const steps = [
        {
          title: 'Personal Information',
          content: pageOne(),
        },
        {
          title: 'Commitments',
          content: pageTwo(),
        },
        {
          title: 'Work Informatiom',
          content: 'Last-content',
        },
        {
            title: 'Specialization Information',
            content: 'Last-content',
        },
      ];
      
    const [current, setCurrent] = useState(0); 
    const [buttonState, setButtonState] = useState(0);
    const next = () => {
        setCurrent(current + 1);
      };
    
      const prev = () => {
        setCurrent(current - 1);
      };

      

    function pageOne() {
        return (
            <div className="page-one-containere">
            <div className="flex flex-row">
              <div className="page-one-column-container">
                <div className="page-one-header">
                  Personal Information
                </div>
                <Form>
                <Form.Item
                  name="first-name"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <ModalInput
                    type="text"
                    title="*First Name"
                  />
                </Form.Item>
                <Form.Item
                  name="last-name"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <ModalInput
                    type="text"
                    title="*Last Name*"
                  />
                </Form.Item>
                <Form.Item
                  name="cell-number"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <ModalInput
                    type="text"
                    title="*Cell Phone Number*"
                  />
                </Form.Item>
                <Form.Item
                  name="business-number"
                  rules={[
                    {
                      required: false,
                    },
                  ]}
                >
                  <ModalInput
                    type="text"
                    title="Business Number"
                  />
                </Form.Item>
                <Form.Item
                  name="email"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <ModalInput
                    type="text"
                    title="*Email"
                  />
                </Form.Item>
                <Form.Item
                  name="hear-about-us"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <ModalInput
                    type="text"
                    title="*From whom or where did you hear about us?"
                  />
                </Form.Item>
                <Form.Item
                  name="why-mentee"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <ModalInput
                    type="text"
                    title="*Please share why you would like to becoome apart of our MENTEE Mentor Specialist team?"
                    style={{ overflow: "hidden" }}
                  />
                </Form.Item>
                </Form>
                </div>
                </div>
              </div>
        )
    }

    function pageTwo() {
        return (
        <div className="page-two-containere">
        <div className="flex flex-row">
          <div className="page-two-column-container">
            <div className="page-two-header">
              Commitments
            </div>
            <div className="donation-question">
                <p4>*As a MENTEE global mentor, you wll have your own profile page where
                you will highlight your skills and how you can help our mentees
                either synchronously or asynchronously. You will also have thte opportunity 
                to post your own videos that share your specific guidance or lessons to help our mentees.
                Additionally, you will have a networking space that will allow you to get to know othere
                specialists froom around the world and networking events that are online and global.
                MENTEE is a volunteer organization and we are 100% sustained by donations. Are you able to offer
                a donation for one year?*</p4>
                <div className="donation-answer-choices">
                <Form layout="inline">
       
            </Form>
                </div>
            </div>
            </div>
            </div>
          </div>
    )
    }
    
    return (
        <>
          <Steps current={current}>
            {steps.map(item => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
          <div className="steps-content">{steps[current].content}</div>
          <div className="steps-action">
          <div className="next-button">
            {current < steps.length - 1 && (
              <MenteeButton 
              content={<b>Next ></b>}
              width={"7%"}
              onClick={() => next()}
    
             />
            )}
          </div>
          <div className="previous-button">
            {current > 0 && (
              <MenteeButton 
              content={<b> Previous</b>}
              width={"7%"}
              onClick={() => prev()}
             />
            )}
            </div>
            {current === steps.length - 1 && (
              <MenteeButton type="primary" onClick={() => message.success('Processing complete!')}>
                Done
              </MenteeButton>
            )}
            </div>

        </>
      );
}
export default MentorApplication; 