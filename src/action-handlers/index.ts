import AcquisitionPackage from "@/store/acquisitionPackage";
import DescriptionOfWork from "@/store/descriptionOfWork";

import router from "@/router";

const actionHandlerNames = {
  sampleAdditionalButtonAction: "sampleAdditionalButtonAction",
  deleteServiceOfferingGroup: "deleteServiceOfferingGroup",
  confirmOtherOfferingDeletion: "confirmOtherOfferingDeletion",
  confirmServiceDeletion: "confirmServiceDeletion",
  clearCurrentContractInfo: "clearCurrentContractInfo",
  confirmDeleteTravelAll: "confirmDeleteTravelAll"
}

const actions =  {
  [actionHandlerNames.sampleAdditionalButtonAction]: sampleAdditionalButtonAction,
  [actionHandlerNames.deleteServiceOfferingGroup]: deleteServiceOfferingGroup,
  [actionHandlerNames.confirmOtherOfferingDeletion]: confirmOtherOfferingDeletion,
  [actionHandlerNames.confirmServiceDeletion]: confirmServiceDeletion,
  [actionHandlerNames.clearCurrentContractInfo]: clearCurrentContractInfo,
  [actionHandlerNames.confirmDeleteTravelAll]: confirmDeleteTravelAll,
};

async function actionHandler(actionName: string, actionArgs: string[]): Promise<void> {
  await actions[actionName](actionArgs);
} 

function sampleAdditionalButtonAction(actionArgs: string[]) {
  // commented code for demonstration purposes only
  // console.log('args in actionHandler:', actionArgs);
  // const [foo, bar] = actionArgs;
  // console.log("in action-handler: foo: " + foo + "bar: " + bar);
  AcquisitionPackage.sampleAdditionalButtonActionInStore(actionArgs);
  alert("\"Cancel\" will navigate to JWCC intro when completed.");
}

function clearCurrentContractInfo() {
  AcquisitionPackage.clearCurrentContractInfo();
}

// used in Performance Requirements when user clicks "I don't need these cloud resources" button
async function deleteServiceOfferingGroup() {
  await DescriptionOfWork.removeCurrentOfferingGroup();

  router.push({
    name: "pathResolver",
    params: {
      resolver: "ServiceOfferingsPathResolver",
      direction: "next"
    },
  }).catch(() => console.log("avoiding redundant navigation"));
}

// used in Other Offerings when user clicks "I don't need ____ resources" button
async function confirmOtherOfferingDeletion() {
  DescriptionOfWork.setConfirmOtherOfferingDelete(true);
}

async function confirmServiceDeletion() {
  await DescriptionOfWork.setConfirmServiceOfferingDelete(true);
}

async function confirmDeleteTravelAll() {
  await DescriptionOfWork.setConfirmTravelDeleteAll(true);
}

export default actionHandler;
