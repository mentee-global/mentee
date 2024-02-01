describe("Apply form for Mentor Visibility checking", () => {
  it("should navigate to the correct URL on clicking the anchor tag", () => {
    cy.visit("/apply");

    const userEmail = "test6@example.com";
    cy.get("#email").type(userEmail);
    //checking select fro Mentee
    cy.get("#role").click();
    cy.contains("Mentor").click();
    // click submit button
    cy.get("#submit").click();
    cy.wait(1000);
    cy.get("#submit").click({
      force: true,
    });

    cy.get(
      "#back"
    ).click();

    cy.url().should("include", "/");
  });

  it("check the visibilty of form for mentee", () => {
    cy.visit("/apply");

    const userEmail = "testa@example.com";
    cy.get("#email").type(userEmail);
    //checking select fro Mentee
    cy.get("#role").click();
    cy.contains("Mentor").click();
    cy.get(".ant-select-selection-item").should("have.attr", "title", "Mentor");
    // click submit button
    cy.get("#submit").click();
    cy.wait(6000);
    cy.get("#submit").click({
      force: true,
    });

    cy.get("#welcome")
      .invoke("text")
      .then((text) => {
        const trimmedText = text.trim();
        expect(trimmedText).to.equal("Welcome to MENTEE!");
      });

    cy.get(
      "#mentorIntroduction"
    ).should(
      "contain",
      "We appreciate your interest in becoming a volunteer Global Mentor for MENTEE, a global nonprofit accelerating personal and professional growth to make the world a better, healthier place."
    );

    cy.get(
      "#mentorfilloutprompt"
    ).should("contain", "Please fill out the application below");

    cy.get('label[for="firstName"].ant-form-item-required').should(
      "have.text",
      "First Name"
    );

    cy.get('label[for="lastName"]').should("contain", "Last Name");

    cy.get('label[for="phoneNumber"]').should("contain", "Phone Number");

    cy.get('label[for="hearAboutUs"]').should(
      "contain",
      "From whom or where did you hear about us?"
    );

    cy.get('label[for="knowledgeLocation"]').should(
      "contain",
      "Please share which region(s), country(s), state(s), cities your knowledge is based in"
    );

    cy.get('label[for="previousLocations"]').should(
      "contain",
      "Where have you lived in your life besides where you live now?"
    );

    cy.get('label[for="employerName"]').should(
      "contain",
      "Full name of your company/employer"
    );

    cy.get('label[for="jobDescription"]').should(
      "contain",
      "Your full title and a brief description of your role"
    );

    cy.get('label[for="jobDuration"]').should(
      "contain",
      "How long have you been with this company?"
    );

    cy.get('label[for="commitDuration"]').should(
      "contain",
      "If you are accepted as a global mentor, would you like to commit to..."
    );

    cy.get('label[for="immigrationStatus"]').should(
      "contain",
      "Are you an immigrant or refugee or do you come from an immigrant family or refugee family?"
    );
    cy.get("#immigrationStatus > label:nth-child(1)").should("contain", "Yes");

    cy.get("#immigrationStatus > label:nth-child(2)").should("contain", "No");

    cy.get('label[for="communityStatus"]').should(
      "contain",
      "Are you or your family from a native or aboriginal community?"
    );
    cy.get("#communityStatus > label:nth-child(1) > span:nth-child(2)").should(
      "contain",
      "Yes"
    );
    cy.get("#communityStatus > label:nth-child(2) > span:nth-child(2)").should(
      "contain",
      "No"
    );

    cy.get('label[for="economicBackground"]').should(
      "contain",
      "Did you grow up economically challenged?"
    );

    cy.get("#communityStatus > label:nth-child(1) > span:nth-child(2)").should(
      "contain",
      "Yes"
    );

    cy.get("#communityStatus > label:nth-child(2) > span:nth-child(2)").should(
      "contain",
      "No"
    );

    cy.get('label[for="economicBackground"]').should(
      "contain",
      "Did you grow up economically challenged?"
    );
    cy.get("#communityStatus > label:nth-child(1) > span:nth-child(2)").should(
      "contain",
      "Yes"
    );
    cy.get("#communityStatus > label:nth-child(2) > span:nth-child(2)").should(
      "contain",
      "No"
    );

    cy.get('label[for="isPersonOfColor"]').should(
      "contain",
      "Would you consider yourself of person of color"
    );
    cy.get(
      "#economicBackground > label:nth-child(1) > span:nth-child(2)"
    ).should("contain", "Yes");
    cy.get(
      "#economicBackground > label:nth-child(2) > span:nth-child(2)"
    ).should("contain", "No");

    cy.get('label[for="genderIdentification"]').should(
      "contain",
      "What do you identify as?"
    );

    cy.get('label[for="isMarginalized"]').should(
      "contain",
      "Would you define yourself as having been or currently marginalized"
    );
    cy.get("#isMarginalized > label:nth-child(1) > span:nth-child(2)").should(
      "contain",
      "Yes"
    );
    cy.get("#isMarginalized > label:nth-child(2) > span:nth-child(2)").should(
      "contain",
      "No"
    );

    cy.get('label[for="languageBackground"]').should(
      "contain",
      "Do you speak a language(s) other than English? If yes, please write the language(s) below and include your fluency level (conversational, fluent, native)"
    );

    cy.get('label[for="referral"]').should(
      "contain",
      "If you know someone who would be a great global mentor, please share their name, email, and we'll contact them!"
    );

    cy.get('label[for="canDonate"]').should(
      "contain",
      "MENTEE is a volunteer organization and we are sustained by donations. Are you able to offer a donation for one year?"
    );

    cy.get("#canDonate > label:nth-child(1) > span:nth-child(2)").should(
      "contain",
      "Yes, I can offer a donation now to help support this work!"
    );

    cy.get("#canDonate > label:nth-child(1) > span:nth-child(2)").should(
      "contain",
      "(https://www.menteteglobal.org/donate)"
    );

    cy.get("#canDonate > label:nth-child(2) > span:nth-child(2)").should(
      "contain",
      "No, unfortunately I cannot offer a donation now but please ask me again."
    );

    cy.get("#canDonate > label:nth-child(3) > span:nth-child(2)").should(
      "contain",
      "I'm unable to offer a donation."
    );

    cy.get("button.ant-btn-primary.ant-btn-block").should("contain", "Submit");
  });
});
