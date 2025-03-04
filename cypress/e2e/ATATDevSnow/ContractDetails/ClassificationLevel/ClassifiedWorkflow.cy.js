/* eslint-disable cypress/no-unnecessary-waiting */
import {
  randomAlphaNumeric,
  randomNumber,
  randomString,
  suffixId,
} from "../../../../helpers";
import common from "../../../../selectors/common.sel";
import contractDetails from "../../../../selectors/contractDetails.sel";

describe("Test suite: Contract Details: E2E work flow", () => {
  let pt = "TC-Step-3-ContractDetails-E2E-" + randomAlphaNumeric(5);
  let scope = "Project Scope-" + randomString(5);
  let classInput = randomNumber(2);
  let securityReqDetails;
  let alertMessage =
    "You do not need to complete a DD Form 254," +
    " DoD Contract Security Classification Specification, for this task order." +
    " JWCC provides a DD Form 254 at the contract level that covers access to all" +
    " classification levels for the task orders ordered within it.";
  let cdsLabelTxt = "What type of cross-domain solution do you need?";
  const inputText = randomAlphaNumeric(8);

  beforeEach(() => {
    cy.fixture("securityRequirement").then((sr) => {
      securityReqDetails = sr;
    });
    cy.goToContractDetailsStep(
      pt, scope,
      contractDetails.popStartDateYesRadioOption,
      "YES",
      inputText
    )
  });

  it("TC1: If unclassified Class Level selected ", () => {
    cy.selectCheckBoxes([contractDetails.level2]);
    cy.clickContinueButton(contractDetails.level2, "Your Contract Details Summary");
  });

  it("TC2: If both unclassified & Secret Class Level selected ", () => {
    cy.selectCheckBoxes([contractDetails.level5, contractDetails.level6]);
    const expectedLabels = [
      "Unclassified / Impact Level 5 (IL5)" +
      " Accommodates DoD CUI and National Security Systems",
      "Secret / Impact Level 6 (IL6)",
    ];
    cy.verifyCheckBoxLabels(
      contractDetails.checkedClassCheckBoxes,
      expectedLabels
    );
    cy.wait(2000);
    cy.btnClick(common.continueBtn, " Continue ");
    cy.waitUntilElementIsGone(contractDetails.level4);
    cy.verifyPageHeader("Let’s find out more about your security requirements");
    cy.verifyCheckBoxLabels(
      contractDetails.secretCheckbox,
      securityReqDetails.secret.checkboxes
    );
    const secretcb_1Sel = suffixId(contractDetails.checkbox_1, "Secret");
    const secretcb_2Sel = suffixId(contractDetails.checkbox_2, "Secret");
    cy.selectCheckBoxes([secretcb_1Sel, secretcb_2Sel]);
    cy.btnClick(common.continueBtn, " Continue ");
    cy.waitUntilElementIsGone(secretcb_1Sel);
    cy.verifyPageHeader("Do you require a cross-domain solution (CDS)?");
    cy.findElement(contractDetails.cdsYesOption)
      .click({
        force: true
      })
      .then(() => {
        cy.findElement(contractDetails.cds).should("be.visible");
        cy.textExists(contractDetails.cdsLabel, cdsLabelTxt);
        cy.verifyCheckBoxLabels(
          contractDetails.cdsCheckbox,
          securityReqDetails.unClassSecretCDS.checkboxes
        );
        cy.selectCheckBoxes([contractDetails.unclastoSecrCB]);
        cy.enterTextInTextField(contractDetails.cdsUtoSTxtbox, classInput);
        const checkedbox = ["Unclassified to Secret"];
        cy.verifyCheckBoxLabels(contractDetails.cdsCheckedbox, checkedbox);
        const fs = "TestFS - " + randomAlphaNumeric(3);
        cy.enterTextInTextField(contractDetails.projectedFSField, fs);
        const anticipatedText = randomAlphaNumeric(17);
        cy.anticipatedNeedUsage(contractDetails.anticipatedTxtbox, anticipatedText, contractDetails.entiredDurationNo);
        cy.clickContinueButton(contractDetails.unclastoSecrCB, "Your Contract Details Summary");
      });
  });

  it("TC3: If Top Secret Class Level selected", () => {
    cy.selectSecretLevel(contractDetails.ts, alertMessage);
    const expectedLabels = ["Top Secret"];
    cy.verifyCheckBoxLabels(
      contractDetails.checkedClassCheckBoxes,
      expectedLabels
    );
    cy.wait(2000);
    cy.btnClick(common.continueBtn, " Continue ");
    cy.waitUntilElementIsGone(contractDetails.level4);
    cy.verifyPageHeader("Let’s find out more about your security requirements");
    cy.verifyTextMatches(
      contractDetails.tsLabel,
      securityReqDetails.topSecret.label
    );
    cy.verifyCheckBoxLabels(
      contractDetails.tsCheckbox,
      securityReqDetails.topSecret.checkboxes
    );
    const tscb_1Sel = suffixId(contractDetails.checkbox_1, "TopSecret");
    const tscb_7Sel = suffixId(contractDetails.checkbox_7, "TopSecret");
    cy.selectCheckBoxes([tscb_1Sel, tscb_7Sel]);
    cy.clickContinueButton(contractDetails.checkbox_7, "Your Contract Details Summary");
  });

  it("TC4: If Secret & Top Secret Class Level selected,no unclassified ", () => {
    cy.selectCheckBoxes([contractDetails.level6, contractDetails.ts]);
    const expectedLabels = ["Secret / Impact Level 6 (IL6)", "Top Secret"];
    cy.verifyCheckBoxLabels(
      contractDetails.checkedClassCheckBoxes,
      expectedLabels
    );
    cy.wait(2000);
    cy.btnClick(common.continueBtn, " Continue ");
    cy.waitUntilElementIsGone(contractDetails.level4);
    cy.verifyPageHeader("Let’s find out more about your security requirements");
    cy.findElement(contractDetails.secretSection).should("exist");
    cy.verifyTextMatches(
      contractDetails.secretLabel,
      securityReqDetails.secret.label
    );
    cy.findElement(contractDetails.tsSection).should("exist");
    cy.findElement(contractDetails.tsLabel).scrollIntoView();
    cy.verifyTextMatches(
      contractDetails.tsLabel,
      securityReqDetails.topSecret.label
    );
    cy.verifyCheckBoxLabels(
      contractDetails.tsCheckbox,
      securityReqDetails.topSecret.checkboxes
    );
    const scb_3Sel = suffixId(contractDetails.checkbox_3, "Secret");
    const tscb_2Sel = suffixId(contractDetails.checkbox_2, "TopSecret");
    const tscb_4Sel = suffixId(contractDetails.checkbox_4, "TopSecret");
    cy.selectCheckBoxes([scb_3Sel, tscb_2Sel, tscb_4Sel]);
    cy.btnClick(common.continueBtn, " Continue ");
    cy.waitUntilElementIsGone(tscb_2Sel);
    cy.wait(2000);
    cy.verifyPageHeader("Do you require a cross-domain solution (CDS)?");
    cy.findElement(contractDetails.cdsYesOption)
      .click({
        force: true
      })
      .then(() => {
        cy.findElement(contractDetails.cds).should("be.visible");
        cy.textExists(contractDetails.cdsLabel, cdsLabelTxt);
        cy.verifyCheckBoxLabels(
          contractDetails.cdsCheckbox,
          securityReqDetails.secToTS.checkboxes
        );
        cy.selectCheckBoxes([contractDetails.tsToS]);
        cy.enterTextInTextField(contractDetails.cdsTxtbox, classInput);
        const checkedbox = ["Top Secret to Secret"];
        cy.verifyCheckBoxLabels(contractDetails.cdsCheckedbox, checkedbox);
        const fs = "TestFS - " + randomAlphaNumeric(3);
        cy.enterTextInTextField(contractDetails.projectedFSField, fs);
        const anticipatedText = randomAlphaNumeric(17);
        cy.anticipatedNeedUsage(contractDetails.anticipatedTxtbox, anticipatedText, contractDetails.entiredDurationNo);
        cy.clickContinueButton(contractDetails.entiredDurationNo, "Your Contract Details Summary");
      });
  });

  it("TC5: If unclassified, Secret & Top Secret Class Level selected", () => {
    cy.selectCheckBoxes([
      contractDetails.level2,
      contractDetails.level6,
      contractDetails.ts,
    ]);
    const expectedLabels = [
      "Unclassified / Impact Level 2 (IL2)" +
      " Accommodates DoD information approved for public release" +
      " (Low Confidentiality and Moderate Integrity)",
      "Secret / Impact Level 6 (IL6)",
      "Top Secret",
    ];
    cy.verifyCheckBoxLabels(
      contractDetails.checkedClassCheckBoxes,
      expectedLabels
    );
    cy.wait(2000);
    cy.btnClick(common.continueBtn, " Continue ");
    cy.waitUntilElementIsGone(contractDetails.level4);
    cy.verifyPageHeader("Let’s find out more about your security requirements");
    const scb_5Sel = suffixId(contractDetails.checkbox_5, "Secret");
    const tscb_6Sel = suffixId(contractDetails.checkbox_6, "TopSecret");
    const tscb_9Sel = suffixId(contractDetails.checkbox_9, "TopSecret");
    cy.selectCheckBoxes([scb_5Sel, tscb_6Sel, tscb_9Sel]);
    cy.btnClick(common.continueBtn, " Continue ");
    cy.waitUntilElementIsGone(tscb_9Sel);
    cy.verifyPageHeader("Do you require a cross-domain solution (CDS)?");
    cy.findElement(contractDetails.cdsYesOption)
      .click({
        force: true
      })
      .then(() => {
        cy.findElement(contractDetails.cds).should("be.visible");
        cy.textExists(contractDetails.cdsLabel, cdsLabelTxt);
        cy.verifyCheckBoxLabels(
          contractDetails.cdsCheckbox,
          securityReqDetails.classCDS.checkboxes
        );
        cy.selectCheckBoxes([
          contractDetails.unclastoSecrCB,
          contractDetails.tsToS,
        ]);
        cy.enterTextInTextField(contractDetails.cdsUtoSTxtbox, classInput);
        cy.enterTextInTextField(contractDetails.cdsTStoSTxtbox, classInput);
        const checkedbox = ["Unclassified to Secret", "Top Secret to Secret"];
        cy.verifyCheckBoxLabels(contractDetails.cdsCheckedbox, checkedbox);
        const fs = "TestFS - " + randomAlphaNumeric(3);
        cy.enterTextInTextField(contractDetails.projectedFSField, fs);
        const anticipatedText = randomAlphaNumeric(17);
        cy.anticipatedNeedUsage(contractDetails.anticipatedTxtbox, anticipatedText, contractDetails.entiredDurationNo);
        cy.clickContinueButton(contractDetails.entiredDurationNo, "Your Contract Details Summary");
      });
  });
});