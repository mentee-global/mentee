import React, { useEffect, useState } from "react";
import { Steps, message, Form, Input, Radio, Row, Col, Checkbox} from 'antd';
import MenteeButton from "../MenteeButton";
import MentorApplicationPage from "../css/MentorApplicationPage.scss";
import { createApplication } from "../../utils/api";

function MentorApplication() { 
    // constant declarations   
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

    // on change for radiio buttons 
    const [offerDonation, setOfferDonation] = useState(1);
    const [commitTime, setCommitTime] = useState(1);
    const [immigrantStatus, setImmigrantStatus] = useState(1);
    const [specialistTime, setSpecialistTime] = useState(1);
    const [companyTime, setCompanyTime] = useState(1);
    const [onLinkedin, setOnLinkedin] = useState(1);

    const onChange1 = (e) => {
        console.log('radio checked', e);
        setOfferDonation(e.target.value);
      };

      const onChange2 = (e) => {
        console.log('radio checked', e);
        setCommitTime(e.target.value);
      };

      const onChange3 = (e) => {
        console.log('radio checked', e);
        setImmigrantStatus(e.target.value);
      };

      const onChange4 = (e) => {
        console.log('radio checked', e);
        setSpecialistTime(e.target.value);
      };

      const onChange5 = (e) => {
        console.log('radio checked', e);
        setCompanyTime(e.target.value);
      };

      const onChange6 = (e) => {
        console.log('radio checked', e);
        setOnLinkedin(e.target.value);
      };

      // on change for checked boxes
      const [mentoringOptions, setMentoringOptions] = useState([]);
      const [sectors, setSectors] = useState([]);
      const [topics, setTopics] = useState([]);

      function onChangeCheck(checkedValues) {
        console.log('checked = ', checkedValues);
        let optionsSelected = [];
        checkedValues.forEach((value) => {
          console.log(value);
          optionsSelected.push(value);
        });
        setMentoringOptions(optionsSelected);
      }

      function onChangeCheck2(checkedValues) {
        console.log('checked = ', checkedValues);
        let optionsSelected = [];
        checkedValues.forEach((value) => {
          optionsSelected.push(value);
        });
        console.log("sectors", optionsSelected);
        setSectors(optionsSelected);
      }

      function onChangeCheck3(checkedValues) {
        console.log('checked = ', checkedValues);
        let optionsSelected = [];
        checkedValues.forEach((value) => {
          optionsSelected.push(value);
        });
        setTopics(optionsSelected);
      }

      // sets text fields 
      const [firstName, setFirstName] = useState(null);
      const [lastName, setLastName] = useState(null);
      const [cell, setCell] = useState(null);
      const [businessNum, setBusinessNum] = useState(null);
      const [email, setEmail] = useState(null);
      const [hearAbout, setHearAbout] = useState(null);
      const [whyMentee, setWhyMentee] = useState(null);
      const [title, setTitle] = useState(null);
      const [employer, setEmployer] = useState(null);
      const [knowledgeLocation, setknowledgeLocation] = useState(null);
      const [referral, setReferral] = useState(null);
      const [languages, setLanguages] = useState(null);
  
    // creates steps layout 
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
          title: 'Work Information',
          content: pageThree(),
        },
        {
            title: 'Specialization Information',
            content: pageFour(),
        }
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
      console.log(firstName);
        return (
              <div className="page-one-column-container">
                <div className="page-one-header">
                  <h1>Personal Information</h1>
                </div>
                <div className="column-one">
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
                    value = {firstName}
                    onChange={(e) => setFirstName(e.target.value)}
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
                    value = {lastName}
                    onChange={(e) => setLastName(e.target.value)}
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
                    value = {cell}
                    onChange={(e) => setCell(e.target.value)}
                  />
                </Form.Item>
                </Form>
                </div>
                <div className="column-two">
                <Form>
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
                    value = {businessNum}
                    onChange={(e) => setBusinessNum(e.target.value)}
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
                    value = {email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value = {hearAbout}
                    onChange={(e) => setHearAbout(e.target.value)}
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
                    value = {whyMentee}
                    onChange={(e) => setWhyMentee(e.target.value)}
                  />
                </Form.Item>
                </Form>
                </div>
              </div>
        )
    }

    function pageTwo() {
        return (
          <div className="page-two-column-container">
            <div className="page-two-header">
              <h2>Commitments</h2>
            </div>
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
                <div className="donation-question">
                <p4>*As a MENTEE global mentor, you wll have your own profile page where
                you will highlight your skills and how you can help our mentees
                either synchronously or asynchronously. You will also have thte opportunity 
                to post your own videos that share your specific guidance or lessons to help our mentees.
                Additionally, you will have a networking space that will allow you to get to know othere
                specialists froom around the world and networking events that are online and global.
                MENTEE is a volunteer organization and we are 100% sustained by donations. Are you able to offer
                a donation for one year?*</p4>
                </div>
                    <Radio.Group name="donation" onChange={onChange1} value={offerDonation}>
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
                    <Checkbox.Group options={workOptions} defaultValue={mentoringOptions} onChange={onChangeCheck}/>
                    </div>
                </div>
                <div className="time-options-question">
                  *Please choose the option(s) that is right for you  
                  <div className="time-options-answers">
                  <Radio.Group onChange={onChange2} value={commitTime}>
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
                  <Radio.Group onChange={onChange3} value={immigrantStatus}>
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
                  <Radio.Group name="a" onChange={onChange4} value={specialistTime}>
                        <Radio value={"One year with us"}>One year with us
                        </Radio>
                        <Radio value={'Two years with us'}>Two years with us
                        </Radio>
                        </Radio.Group>
                    </div>
                </div>
            </div>
    )
    }

    function pageThree() {
      console.log(sectors);
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
              <Checkbox.Group options={workSectors} value= {sectors} onChange={onChangeCheck2}/>
              </div>
              <div className="role-description-question">
                  <div className="role-description-answers">
                  <Form.Item
                  name="role-description"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                   *Your full title and a brief description of your role.
                  <Input
                    type="text"
                    placeholder="*Your full title and a brief description of your role."
                    value = {title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Form.Item>
                  </div>
              </div>
              <div className="employer-name-question">
                  <div className="employer-name-answers">
                  <Form.Item
                  name="employer-name"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  *Full name of your company/employer
                  <Input
                    type="text"
                    placeholder="*Full name of your company/employer"
                    value = {employer}
                    onChange={(e) => setEmployer(e.target.value)}
                  />
                </Form.Item>
                  </div>
              </div>
              <div className="time-at-company-question">
                  *How long have you been with this company? 
                  <div className="time-options-answers">
                  <Radio.Group onChange={onChange5} value={companyTime}>
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
                  <Radio.Group onChange={onChange6} value={onLinkedin}>
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

  const [isSubmitted, setIsSubmitted] = useState(false);
  function handleSubmit(event) {
    event.preventDefault();
    async function submitApplication() {
      // onOk send the put request
      const data = {
        email: email,
        name: firstName + " " + lastName,
        cell_number: cell,
        business_number: businessNum,
        hear_about_us: hearAbout,
        offer_donation: offerDonation,
        mentoring_options: mentoringOptions,
        employer_name: employer,
        role_description: title,
        work_sectors: sectors,
        time_at_current_company: companyTime,
        linkedin: onLinkedin,
        why_join_mentee: whyMentee,
        commit_time: commitTime,
        specialist_time: specialistTime,
        specializations: topics,
        immigrant_status: immigrantStatus,
        languages: languages,
        referral: referral,
        knowledge_location: knowledgeLocation,
        date_submitted: new Date()
      }
      console.log(data);
      await createApplication(data);
    }
    submitApplication();
    setIsSubmitted(true); 
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
            <Checkbox.Group options={specialTopics} value= {topics} onChange={onChangeCheck3}/>
            </div>
            <div className="region-question">
                <div className="region-answers">
                <Form.Item
                name="region-question"
                rules={[
                  {
                    required: false,
                  },
                ]}
              >
              Please share which region(s), country(s), state(s), cities your 
              knowledge is based in
                <Input
                  type="text"
                  placeholder="Please share which region(s), country(s), state(s), cities your 
                  knowledge is based in"
                  value = {knowledgeLocation}
                  onChange={(e) => setknowledgeLocation(e.target.value)}
                />
              </Form.Item>
                </div>
            </div>
            <div className="contact-other-question">
                <div className="contact-other-answers">
                <Form.Item
                name="contact-other"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                *If you know someone who would be a great MENTEE 
                Specialist, please share their name, email, and we'll contact
                them!
                <Input
                  type="text"
                  placeholder="*If you know someone who would be a great MENTEE 
                  Specialist, please share their name, email, and we'll contact
                  them!"
                  value = {referral}
                  onChange={(e) => setReferral(e.target.value)}
                />
                
              </Form.Item>
                </div>
            </div>
            <div className="languages-question">
                <div className="languages-answers">
                <Form.Item
                name="languages"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                *Do you speak a language(s) other than English? If yes, please
                write the language(s) below and include your fluency level
                (conversational, fluent, native).
                <Input
                  type="text"
                  placeholder="*Do you speak a language(s) other than English? If yes, please
                  write the language(s) below and include your fluency level
                  (conversational, fluent, native)."
                  value = {languages}
                  onChange={(e) => setLanguages(e.target.value)}
                />
              </Form.Item>
                  </div>
              </div>
              <div className="submit-button">
              <MenteeButton 
              content={<b> Submit</b>}
              width={"7%"}
              onClick={handleSubmit}
             />
              </div>  
        </div>
        </div>
        </div>
      </div>
)
}

function successPage() {
    return (
      <div className="success-message">
        <h1>You have sucessfully submitted your global mentor application</h1>
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
            </div>
        </>
      );
}
export default MentorApplication; 