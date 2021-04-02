import React, { useEffect, useState } from "react";
import { Steps, message, Form, Input, Radio, Row, Col,Checkbox} from 'antd';
import MenteeButton from "../MenteeButton";
import ModalInput from "../ModalInput";

function MentorApplication() { 
    const { Step } = Steps;
    const { TextArea } = Input;
    const onChange = e => {
        console.log('radio checked', e.target.value);
        setValue(e.target.value);
      };
      const [value, setValue] = useState(1);
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
                  <h1>Personal Information</h1>
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
                  *First Name"
                  <Input
                    type="text"
                    placeholder="*First Name"
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
                  *Last Name*
                  <Input
                    placeholder="*Last Name*"
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
                  *Cell Phone Number*
                  <Input
                    type="text"
                    placeholder="*Cell Phone Number*"
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
                  Business Number
                  <Input
                    type="text"
                    placeholder="Business Number"
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
                  *Email
                  <Input
                    type="text"
                    placeholder="*Email"
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
                  *From whom or where did you hear about us?
                  <Input
                    type="text"
                    placeholder="*From whom or where did you hear about us?"
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
                  <div className="why-mentee-question">
                  *Please share why you would like to becoome apart of our MENTEE Mentor Specialist team?
                  </div>
                  <TextArea autoSize
                    placeholder="*Please share why you would like to becoome apart of our MENTEE Mentor Specialist team?"
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
                <Form.Item
                  name="why-mentee"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                    <Radio.Group onChange={onChange} value={value}>
                        <Radio value={1}>Yes, I can offer a donation now to help suppourt this work! (https://www.menteteglobal.org/donate)</Radio>
                        <Radio value={2}>No, unfortunately I cannot offer a donation nowm but please ask me again.</Radio>
                        <Radio value={3}>I'm unable to offer a donation.</Radio>
                </Radio.Group>
                </Form.Item>
                </Form>
                </div>
                <div className="mentoring-options-question">
                    *Please choose the option(s) that is right for you
                    <div className="mentoring-options-answers">
                      <Checkbox.Group
                        
                      />
                    </div>
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