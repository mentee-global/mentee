import React, { useEffect, useState } from "react";
import { Steps, message, Form, Input, Radio, Row, Col, Checkbox} from 'antd';
import MenteeButton from "../MenteeButton";
import ModalInput from "../ModalInput";

function MentorApplication() { 
    const { Step } = Steps;
    const { TextArea } = Input;
    const plainOptions = ['I am able to mentor synchronously and asynchronously.', 
    'I am able to mentor only asynchronously.', 
    'I am able to post videos that mentor/teach skills in specific areas.'];

    const workSectors = ['Architecture', 'Arts/Dance/Design/Music', 'Computer Science/Technology/IT',
  'Education', 'Engineering', 'Finance', 'Government/Public Service', 'Healthcare','Human/Social Services',
'Journalism','Law','Marketing','Media/Entertainment/Communications','Nonprofit/NGO','Retail','Sports/Recreation/Leisure'];
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
          content: pageThree(),
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

    function onChangeCheck(checkedValues) {
      console.log('checked = ', checkedValues);
    }

    function pageTwo() {
        return (
        <div className="page-two-containere">
        <div className="flex flex-row">
          <div className="page-two-column-container">
            <div className="page-two-header">
              <h2>Commitments</h2>
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
                    <Checkbox.Group options={plainOptions} defaultValue={['']} onChange={onChangeCheck}/>
                    </div>
                </div>
                <div className="time-options-question">
                  *Please choose the option(s) that is right for you  
                  <div className="time-options-answers">
                  <Radio.Group onChange={onChange} value={value}>
                        <Radio value={1}>I can mentor several times a month.</Radio>
                        <Radio value={2}>I can mentor 1-2 times a month.</Radio>
                        <Radio value={3}>I can mentor several times a year.</Radio>
                        <Radio value={4}>I can mentor a few times a year.</Radio>
                        </Radio.Group>
                    </div>
                </div>

                <div className="immigrant-family-question">
                  *Are you an immigrant or refugee or do you come from an immigrant family or refugee family?
                  <div className="immigrant-family-answers">
                  <Radio.Group onChange={onChange} value={value}>
                        <Radio value={1}>Yes</Radio>
                        <Radio value={2}>No</Radio>
                        </Radio.Group>
                    </div>
                </div>

                <div className="immigrant-family-question">
                  *If you are accepted as a Specialist, would you like to commit to...
                  <div className="immigrant-family-answers">
                  <Radio.Group onChange={onChange} value={value}>
                        <Radio value={1}>One year with us</Radio>
                        <Radio value={2}>Two years with us</Radio>
                        </Radio.Group>
                    </div>
                </div>
            </div>
            </div>
            </div>
          </div>
    )
    }


    function pageThree() {
      return (
      <div className="page-two-containere">
      <div className="flex flex-row">
        <div className="page-two-column-container">
          <div className="page-two-header">
            <h2>Work Information </h2>
          </div>
          <div className="work-sectors-question">
              *Which sector(s) do you work in? (Check all that apply)
              <div className="work-sectors--answer-choices">
              <Form layout="inline">
              <Form.Item
                name="work-sectors"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
              <Checkbox.Group options={workSectors} defaultValue={['']} onChange={onChangeCheck}/>
              </Form.Item>
              </Form>
              </div>
              <div className="role-description-question">
                *Your full title and a brief description of your role.
                  <div className="role-description-answers">
                  <Form.Item
                  name="role-description"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <Input
                    type="text"
                    placeholder="*Your full title and a brief description of your role."
                  />
                </Form.Item>
                  </div>
              </div>
              <div className="employer-name-question">
                  *Full name of your company/employer
                  <div className="employer-name-answers">
                  <Form.Item
                  name="employer-name"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
    
                  <Input
                    type="text"
                    placeholder="*Full name of your company/employer"
                  />
                </Form.Item>
                  </div>
              </div>
              <div className="time-at-company-question">
                  *Please choose the option(s) that is right for you  
                  <div className="time-options-answers">
                  <Radio.Group onChange={onChange} value={value}>
                        <Radio value={1}>I can mentor several times a month.</Radio>
                        <Radio value={2}>I can mentor 1-2 times a month.</Radio>
                        <Radio value={3}>I can mentor several times a year.</Radio>
                        <Radio value={4}>I can mentor a few times a year.</Radio>
                        </Radio.Group>
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