import React, { useEffect, useState } from "react";
import { Steps, message, Form, Input, Radio, Row, Col, Checkbox} from 'antd';
import MenteeButton from "../MenteeButton";
import ModalInput from "../ModalInput";
import MentorApplicationPage from "../css/MentorApplicationPage.scss";

function MentorApplication() { 
    const { Step } = Steps;
    const { TextArea } = Input;
    const workOptions = ['I am able to mentor synchronously and asynchronously.', 
    'I am able to mentor only asynchronously.', 
    'I am able to post videos that mentor/teach skills in specific areas.'];

    const workSectors = ['Architecture', 'Arts/Dance/Design/Music', 'Computer Science/Technology/IT',
  'Education', 'Engineering', 'Finance', 'Government/Public Service', 'Healthcare','Human/Social Services',
'Journalism','Law','Marketing','Media/Entertainment/Communications','Nonprofit/NGO','Retail','Sports/Recreation/Leisure'];

const specialTopics = ['Advocacy and Activism', 'Arts:Dance/Design/Music and More', 'Citizenship',
'Education, Personal Guidance On Next Steps', 'Entrepreneurship', 'Finance, Business', 'Finance, Personal', 'Health, Community, and Enviornment','Health, Personal: Nutrition, Personal Life Coach, Yoga & Meditation',
'Interview Skills & Practice','Journalism','Language Lessons','Letter Writing and Other Communications','Legal Issues, Business','Legal Issues, Related to Personal Issues (Excluding Citizenship)','Media/Public Relations',
'Medicine', 'Nonprofits/NGOs', 'Professional Speaking', 'Resume Writing', 'Self Confidence', 'Small Business', 'Technology Training'];
    const onChange1 = (e) => {
        console.log('radio checked', e);
        setValue1(e.target.value);
      };
      const [value1, setValue1] = useState(1);

      const onChange2 = (e) => {
        console.log('radio checked', e);
        setValue2(e.target.value);
      };
      const [value2, setValue2] = useState(1);

      const onChange3 = (e) => {
        console.log('radio checked', e);
        setValue3(e.target.value);
      };
      const [value3, setValue3] = useState(1);

      const onChange4 = (e) => {
        console.log('radio checked', e);
        setValue4(e.target.value);
      };
      const [value4, setValue4] = useState(1);


      const onChange5 = (e) => {
        console.log('radio checked', e);
        setValue5(e.target.value);
      };
      const [value5, setValue5] = useState(1);

      const onChange6 = (e) => {
        console.log('radio checked', e);
        setValue6(e.target.value);
      };
      const [value6, setValue6] = useState(1);

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
            content: pageFour(),
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

    // 

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
                    <Radio.Group name="donation" onChange={onChange1} value={value1}>
                        <Radio  value={"Yes, I can offer a donation now to help suppourt this work!"}>Yes, I can offer a donation now to help suppourt this work! (https://www.menteteglobal.org/donate)
                        </Radio>
                        <Radio value={"No, unfortunately I cannot offer a donation now but please ask me again."}>No, unfortunately I cannot offer a donation now but please ask me again.
                          
                        </Radio>
                        <Radio value={"I'm unable to offer a donation."}>I'm unable to offer a donation.
                            
                            </Radio>
                </Radio.Group>
                </Form.Item>
                </Form>
                </div>
                <div className="mentoring-options-question">
                    *Please choose the option(s) that is right for you
                    <div className="mentoring-options-answers">
                    <Checkbox.Group options={workOptions} defaultValue={['']} onChange={onChangeCheck}/>
                    </div>
                </div>
                <div className="time-options-question">
                  *Please choose the option(s) that is right for you  
                  <div className="time-options-answers">
                  <Radio.Group onChange={onChange2} value={value2}>
                        <Radio value={"I can mentor several times a month."}>I can mentor several times a month.
                        </Radio>
                        <Radio value={"I can mentor 1-2 times a month."}>I can mentor 1-2 times a month.
                        </Radio>
                        <Radio value={"I can mentor several times a year."}>I can mentor several times a year.
                          </Radio>
                        <Radio value={"I can mentor a few times a year."}>I can mentor a few times a year.
                        </Radio>
                        </Radio.Group>
                    </div>
                </div>

                <div className="immigrant-family-question">
                  *Are you an immigrant or refugee or do you come from an immigrant family or refugee family?
                  <div className="immigrant-family-answers">
                  <Radio.Group onChange={onChange3} value={value3}>
                        <Radio value={'Yes'}>Yes
                        </Radio>
                        <Radio value={'No'}>No
                        </Radio>
                        </Radio.Group>
                    </div>
                </div>

                <div className="immigrant-family-question">
                  *If you are accepted as a Specialist, would you like to commit to...
                  <div className="immigrant-family-answers">
                  <Radio.Group name="a" onChange={onChange4} value={value4}>
                        <Radio value={"One year with us"}>One year with us
                        </Radio>
                        <Radio value={'Two years with us'}>Two years with us
                        </Radio>
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
                  *How long have you been with this company? 
                  <div className="time-options-answers">
                  <Radio.Group onChange={onChange5} value={value5}>
                        <Radio value={"Less than one year."}>Less than one year.
                        </Radio>
                        <Radio value={"1-4 years"}>1-4 years
                        </Radio>
                        <Radio value={"5-10 years"}>5-10 years
                        </Radio>
                        <Radio value={"10+ Years"}>10+ Years
                        </Radio>
                        </Radio.Group>
                    </div>
                </div>
                <div className="linkedin-question">
                  *Are you on Linkedin? (Your linkedin profile will be connected
                  with our MENETEE Specialist profile unless you prefer they
                  remain seperate.) 
                  <div className="time-options-answers">
                  <Radio.Group onChange={onChange6} value={value6}>
                        <Radio value={"Yes"}>Yes
                        </Radio>
                        <Radio value={"No"}>No
                        </Radio>
                        <Radio value={"No, but I am willing to create a Linkedin profile for this program."}>No, but I am willing to create a Linkedin profile for this program.
                        </Radio>
                        </Radio.Group>
                    </div>
                </div>
          </div>
          </div>
          </div>
        </div>
  )
  }

  function pageFour() {
    return (
    <div className="page-two-containere">
    <div className="flex flex-row">
      <div className="page-two-column-container">
        <div className="page-two-header">
          <h2>Specialization Information </h2>
        </div>
        <div className="special-topics-question">
            *What special topics could you teach or offer guidance on? (For
            any region or country- you will be asked next about location.)
            <div className="special-topics-answer-choices">
            <Form layout="inline">
            <Form.Item
              name="special-topics"
              rules={[
                {
                  required: true,
                },
              ]}
            >
            <Checkbox.Group options={specialTopics} defaultValue={['']} onChange={onChangeCheck}/>
            </Form.Item>
            </Form>
            </div>
            <div className="region-question">
              Please share which region(s), country(s), state(s), cities your 
              knowledge is based in
                <div className="region-answers">
                <Form.Item
                name="region-question"
                rules={[
                  {
                    required: false,
                  },
                ]}
              >
                <Input
                  type="text"
                  placeholder="Please share which region(s), country(s), state(s), cities your 
                  knowledge is based in"
                />
              </Form.Item>
                </div>
            </div>
            <div className="contact-other-question">
                *If you know someone who would be a great MENTEE 
                Specialist, please share their name, email, and we'll contact
                them!
                <div className="contact-other-answers">
                <Form.Item
                name="contact-other"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
  
                <Input
                  type="text"
                  placeholder="*If you know someone who would be a great MENTEE 
                  Specialist, please share their name, email, and we'll contact
                  them!"
                />
              </Form.Item>
                </div>
            </div>
            <div className="languages-question">
                *Do you speak a language(s) other than English? If yes, please
                write the language(s) below and include your fluency level
                (conversational, fluent, native).
                <div className="languages-answers">
                <Form.Item
                name="languages"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
  
                <Input
                  type="text"
                  placeholder="*Do you speak a language(s) other than English? If yes, please
                  write the language(s) below and include your fluency level
                  (conversational, fluent, native)."
                />
              </Form.Item>
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
        <div className="page-header">
          
        </div>
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