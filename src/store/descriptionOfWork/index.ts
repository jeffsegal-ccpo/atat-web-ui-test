/* eslint-disable camelcase */
import {
  Action,
  getModule,
  Module,
  Mutation,
  VuexModule,
} from "vuex-module-decorators";
import rootStore from "../index";
import api from "@/api";
import { 
  ClassificationInstanceDTO, 
  CloudSupportEnvironmentInstanceDTO, 
  ComputeEnvironmentInstanceDTO, 
  DatabaseEnvironmentInstanceDTO, 
  EnvironmentInstanceDTO, 
  SelectedServiceOfferingDTO, 
  ServiceOfferingDTO, 
  StorageEnvironmentInstanceDTO, 
  SystemChoiceDTO 
} from "@/api/models";
import {TABLENAME as ServiceOfferingTableName } from "@/api/serviceOffering"
import {
  nameofProperty,
  storeDataToSession,
  retrieveSession,
} from "../helpers";
import Vue from "vue";
import { 
  DOWServiceOfferingGroup, 
  DOWServiceOffering, 
  DOWClassificationInstance,
  OtherServiceOfferingData,
  DOWPoP,
  StorageUnit,
  RadioButton,
} from "../../../types/Global";

import _, { differenceWith, first, last } from "lodash";
import ClassificationRequirements from "@/store/classificationRequirements";
import AcquisitionPackage from "../acquisitionPackage";
import Periods from "../periods";
import { buildClassificationLabel } from "@/helpers";
import { AxiosRequestConfig } from "axios";


// Classification Proxy helps keep track of saved
// Classification Instances so we can efficiently
// update the DOW object
type ClassificationInstanceProxy = {
   dowClassificationInstanceIndex: number;
   classificationInstance: ClassificationInstanceDTO;
}
// service proxy type for saving service offerings
// and associated classification instances
// helps keep track of changes and updating dow object
type ServiceOfferingProxy =  {
  serviceOffering: SelectedServiceOfferingDTO,
  classificationInstances: ClassificationInstanceProxy[]
  dowServiceGroupIndex: number,
  dowServiceIndex: number
}

//helper to map DowService offering
//from DOW object to a ServiceOffering Proxy 
// that can be saved
const mapDOWServiceOfferingToServiceProxy= 
(dowServiceOffering: DOWServiceOffering, groupIndex: number, 
  serviceIndex: number): ServiceOfferingProxy=> {

  
      
  const serviceOffering: SelectedServiceOfferingDTO = {
    service_offering : dowServiceOffering['sys_id'] || "",
    classification_instances: "",
    other_service_offering: dowServiceOffering.otherOfferingName || "",
    sys_id : dowServiceOffering.serviceId.length ? 
      dowServiceOffering.serviceId : undefined
  };


  if(serviceOffering.service_offering === "Other"){
    const soOther = ((dowServiceOffering as unknown) as ServiceOfferingDTO);

    serviceOffering.service_offering = "";
    serviceOffering.other_service_offering = soOther && soOther.other ? soOther.other : ""
  }

  const classificationInstances = dowServiceOffering
    .classificationInstances?.map((instance, instanceIndex)=> {

      const classificationInstance: ClassificationInstanceProxy = {
        dowClassificationInstanceIndex: instanceIndex,
        classificationInstance: {
          selected_periods: instance
            .selectedPeriods?.map(period=>period).join(',') || "",
          classification_level: instance.classificationLevelSysId,
          sys_id: instance.sysId,
          usage_description: instance.anticipatedNeedUsage,
          need_for_entire_task_order_duration: instance.entireDuration
        },
      }
      return classificationInstance;
    }) || [];

  
  return {
    serviceOffering,
    classificationInstances,
    dowServiceGroupIndex: groupIndex,
    dowServiceIndex: serviceIndex
  }

}

const saveOrUpdateOtherServiceOffering = 
  async (
    serviceOffering: OtherServiceOfferingData,
    offeringType: string
  ):Promise<string> => {
    const tempObject: any = {};
    let objSysId = "";

    tempObject.acquisition_package = serviceOffering.acquisitionPackageSysId;
    tempObject.anticipated_need_or_usage = serviceOffering.descriptionOfNeed;
    tempObject.classification_level = serviceOffering.classificationLevel;
    tempObject.instance_name = serviceOffering.requirementTitle;
    tempObject.licensing = serviceOffering.licensing;
    tempObject.memory_amount = serviceOffering.memoryAmount;
    tempObject.memory_unit = serviceOffering.memoryUnit || "GB";
    tempObject.need_for_entire_task_order_duration = serviceOffering.entireDuration;
    tempObject.number_of_instances = serviceOffering.numberOfInstancesNeeded;
    tempObject.number_of_vcpus = serviceOffering.numberOfVCPUs;
    tempObject.operating_system = serviceOffering.operatingSystem;
    tempObject.performance_tier = serviceOffering.performanceTier;
    tempObject.processor_speed = serviceOffering.processorSpeed;
    tempObject.region = serviceOffering.region;
    tempObject.selected_periods = serviceOffering.periodsNeeded.join(",");
    tempObject.storage_amount = serviceOffering.storageAmount;
    tempObject.storage_type = serviceOffering.storageType;
    tempObject.storage_unit = serviceOffering.storageUnit;
    tempObject.sys_id = serviceOffering.sysId;

    switch(offeringType){
    case "compute":
      tempObject.environment_type = serviceOffering.environmentType;
      tempObject.operating_environment = serviceOffering.operatingEnvironment; 
      if(tempObject.sys_id){
        await api.computeEnvironmentInstanceTable.update(
          tempObject.sys_id,
          tempObject as ComputeEnvironmentInstanceDTO
        );
        objSysId = tempObject.sys_id;
      } else {
        const savedObject = await api.computeEnvironmentInstanceTable.create(
          tempObject as ComputeEnvironmentInstanceDTO
        );
        objSysId = savedObject.sys_id as string;
      }
      break;
    case "database":
      tempObject.database_licensing = serviceOffering.databaseLicensing;
      tempObject.database_type = serviceOffering.databaseType;
      tempObject.database_type_other = serviceOffering.databaseTypeOther;
      tempObject.network_performance = serviceOffering.networkPerformance;
      if(tempObject.sys_id){
        await api.databaseEnvironmentInstanceTable.update(
          tempObject.sys_id,
          tempObject as DatabaseEnvironmentInstanceDTO
        );
        objSysId = tempObject.sys_id;
      } else {
        const savedObject = await api.databaseEnvironmentInstanceTable.create(
          tempObject as DatabaseEnvironmentInstanceDTO
        );
        objSysId = savedObject.sys_id as string;
      }
      break;
    case "storage":
      if(tempObject.sys_id){
        await api.storageEnvironmentInstanceTable.update(
          tempObject.sys_id,
          tempObject as StorageEnvironmentInstanceDTO
        );
        objSysId = tempObject.sys_id;
      } else {
        const savedObject = await api.storageEnvironmentInstanceTable.create(
          tempObject as StorageEnvironmentInstanceDTO
        );
        objSysId = savedObject.sys_id as string;
      }
      break;
    case "general_xaas":
      if(tempObject.sys_id){
        await api.environmentInstanceTable.update(
          tempObject.sys_id,
          tempObject as EnvironmentInstanceDTO
        )
        objSysId = tempObject.sys_id;
      } else {
        const savedObject = await api.environmentInstanceTable.create(
          tempObject as EnvironmentInstanceDTO
        );
        objSysId = savedObject.sys_id as string;
      }
      break;
    case "advisory_assistance":
    case "help_desk_services":
    case "documentation_support":
    case "general_cloud_support":
      tempObject.personnel_onsite_access = serviceOffering.personnelOnsiteAccess;
      if(tempObject.sys_id){
        await api.cloudSupportEnvironmentInstanceTable.update(
          tempObject.sys_id,
          tempObject as CloudSupportEnvironmentInstanceDTO
        );
        objSysId = tempObject.sys_id;
      } else {
        const savedObject = await api.cloudSupportEnvironmentInstanceTable.create(
          tempObject as CloudSupportEnvironmentInstanceDTO
        );
        objSysId = savedObject.sys_id as string;
      }
      break;
    default:
      console.log("DOW object saving for this type is not implemented yet.");
      objSysId = "";
      break;
    }

    return objSysId;
  };

const mapClassificationInstanceFromDTO = (
  value: ClassificationInstanceDTO
): DOWClassificationInstance => {
  const impactLevel = ClassificationRequirements.classificationLevels.find((item) => {
    return item.sys_id === value.sys_id;
  });
  const labelLong = impactLevel ? buildClassificationLabel(impactLevel, "long") : "";
  const labelShort = impactLevel ? buildClassificationLabel(impactLevel, "short") : "";
  const selectedPeriods: DOWPoP[] = [];
  if(value.selected_periods !== "") {
    const periods = value.selected_periods.split(",");
    periods.forEach(period => {
      const selectedPeriod = Periods.periods.find((item) => {
        return item.sys_id = period;
      });
      if(selectedPeriod){
        const label = selectedPeriod.period_type === "Base"
          ? "Base period"
          : `Option period ${selectedPeriod.option_order}`;
        selectedPeriods.push({
          label: label,
          sysId: selectedPeriod.sys_id as string
        });
      }
        
    })
  }
  const result: DOWClassificationInstance = {
    anticipatedNeedUsage: value.usage_description,
    classificationLevelSysId: value.classification_level,
    entireDuration: value.need_for_entire_task_order_duration,
    selectedPeriods: selectedPeriods,
    impactLevel: impactLevel?.impact_level || "",
    labelLong: labelLong,
    labelShort: labelShort
  };

  return result;
};

const mapOtherOfferingFromDTO = (
  index: number,
  value: ComputeEnvironmentInstanceDTO | 
    DatabaseEnvironmentInstanceDTO | 
    StorageEnvironmentInstanceDTO | 
    CloudSupportEnvironmentInstanceDTO |
    EnvironmentInstanceDTO
): OtherServiceOfferingData => {

  const acquisitionPackageSysId = 
    typeof value.acquisition_package === "object"
      ? value.acquisition_package.value as string
      : value.acquisition_package as string;

  const classificationLevel = 
    typeof value.classification_level === "object"
      ? value.classification_level.value as string
      : value.classification_level as string;

  const region = 
    typeof value.region === "object"
      ? value.region.value as string
      : value.region as string;

  const result: OtherServiceOfferingData = {
    acquisitionPackageSysId: acquisitionPackageSysId,
    descriptionOfNeed: value.anticipated_need_or_usage,
    classificationLevel: classificationLevel,
    requirementTitle: value.instance_name,
    licensing: value.licensing,
    memoryAmount: value.memory_amount,
    entireDuration: value.need_for_entire_task_order_duration,
    numberOfInstancesNeeded: value.number_of_instances,
    numberOfVCPUs: value.number_of_vcpus,
    operatingSystem: value.operating_system,
    performanceTier: value.performance_tier,
    processorSpeed: value.processor_speed,
    region: region,
    periodsNeeded: value.selected_periods?.split(",") || [],
    storageAmount: value.storage_amount,
    storageType: value.storage_type,
    storageUnit: value.storage_unit as StorageUnit,
    sysId: value.sys_id,
    instanceNumber: index 
  };

  if("environment_type" in value){
    result.environmentType = value.environment_type;
    result.operatingEnvironment = value.operating_environment;
  }

  if("database_licensing" in value){
    result.databaseLicensing = value.database_licensing;
    result.databaseType = value.database_type;
    result.databaseTypeOther = value.database_type_other;
    result.networkPerformance = value.network_performance;
  }

  if("personnel_onsite_access" in value){
    result.personnelOnsiteAccess = value.personnel_onsite_access;
    result.tsContractorClearanceType = value.ts_contractor_clearance_type;
  }

  return result;
};

const ATAT_DESCRIPTION_OF_WORK_KEY = "ATAT_DESCRIPTION_OF_WORK_KEY";

const serviceGroupVerbiageInfo: Record<string, Record<string, string>> = {
  COMPUTE: { 
    offeringName: "Compute",
    headingDetails1: "Compute",
    heading2: "Compute Instance",
    headingSummary: "Compute Requirements", 
    typeForUsage: "instance",
    typeForText: "instance",
    introText: `each Compute instance that you need.`, 
  },
  DATABASE: { 
    offeringName: "Database", 
    heading2: "Database Instance",
    headingSummary: "Database Requirements", 
    typeForUsage: "requirement",
    typeForText: "instance",
    introText: `each Database instance that you need.`, 
  },
  STORAGE: { 
    offeringName: "Storage", 
    heading2: "Storage Instance",
    headingSummary: "Storage Requirementss", 
    typeForUsage: "requirement",
    typeForText: "instance",
    introText: `each Storage instance that you need, separate from your 
      Compute and Database requirements.`,
  },
  GENERAL_XAAS: { 
    offeringName: "General IaaS, PaaS, and SaaS", 
    heading2: "Requirement",
    headingSummary: "General IaaS, PaaS, and SaaS Requirements", 
    typeForUsage: "requirement",
    typeForText: "requirement",
    introText: `any third-party marketplace solutions or cloud resources not covered 
      in the other Anything as a Service (XaaS) categories.`,
  }, 
  ADVISORY_ASSISTANCE: { 
    offeringName: "Advisory and Assistance", 
    heading2: "Advisory and Assistance Services",
    headingSummary: "Advisory and Assistance", 
    typeForUsage: "service",
    typeForText: "service",
    introText: `each Advisory and Assistance service that you need.`,
  },
  HELP_DESK_SERVICES: { 
    offeringName: "Help Desk Services",
    heading2: "Help Desk Service",
    headingSummary: "Help Desk Services", 
    typeForUsage: "service",
    typeForText: "service",
    introText: `each Help Desk Service that you need`,
  },
  TRAINING: { 
    offeringName: "Training", 
    heading2: "Training",
    headingSummary: "Training Requirements", 
    typeForUsage: "training", 
    typeForText: "training",
    introText: `each training that you need.`,
  },
  DOCUMENTATION_SUPPORT: { 
    offeringName: "Documentation Support", 
    heading2: "Documentation Support",
    headingSummary: "Documentation Support Services", 
    typeForUsage: "service",
    typeForText: "service",
    introText: `each Documentation Support service that you need.`,
  },
  GENERAL_CLOUD_SUPPORT: { 
    offeringName: "General Cloud Support", 
    heading2: "Cloud Support Service",
    headingSummary: "General Cloud Support Services", 
    typeForUsage: "service",
    typeForText: "service",
    introText: `any other cloud support services that you need.`,
  },
}

export const instanceEnvTypeOptions: RadioButton[] = [
  {
    id: "DevTesting",
    label: "Dev/Testing",
    value: "DEV_TEST", 
  },
  {
    id: "PreProdStaging",
    label: "Pre-production",
    value: "PRE_PROD",
  },
  {
    id: "Production",
    label: "Production/Staging",
    value: "PROD_STAGING",
  },
  {
    id: "COOP",
    label: "Continuity of Operations Planning (COOP)/Disaster Recovery",
    value: "COOP_DISASTER_RECOVERY"
  }
];

@Module({
  name: "DescriptionOfWork",
  namespaced: true,
  dynamic: true,
  store: rootStore,
})
export class DescriptionOfWorkStore extends VuexModule {
  initialized = false;
  isIncomplete = true;
  serviceOfferings: ServiceOfferingDTO[] = [];
  serviceOfferingGroups: SystemChoiceDTO[] = [];

  // selectedOfferingGroups: stringObj[] = [];
  DOWObject: DOWServiceOfferingGroup[] = [];

  //list of required services -- this is synchronized to back end
  userSelectedServiceOfferings: SelectedServiceOfferingDTO[] = [];

  currentGroupId = "";
  currentOfferingName = "";
  currentOfferingSysId = "";
  xaaSNoneValue = "XaaS_NONE";
  cloudNoneValue = "Cloud_NONE";
  hasXaasService = false
  anticipatedUsersAndDataHasBeenVisited = false
  returnToDOWSummary = false;
  reviewGroupFromSummary = false;
  addGroupFromSummary = false;
  xaasServices = [
    'STORAGE',
    'DATABASE',
    'GENERAL_XAAS',
    'IOT',
    'EDGE_COMPUTING',
    'SECURITY',
    'NETWORKING',
    'MACHINE_LEARNING',
    'APPLICATIONS',
    'DEVELOPER_TOOLS',
    'COMPUTE'
  ];

  @Action({rawError: true})
  public async loadDOWfromAcquistionPackageId(sysId: string): Promise<void> {
    const requestConfig: AxiosRequestConfig = {
      params: {
        sysparm_query: "^acquisition_packageIN" + sysId
      }
    };

    this.setCurrentOfferingGroupId("COMPUTE");
    const computeItems = await api.computeEnvironmentInstanceTable.getQuery(requestConfig);
    if(computeItems.length > 0)
      this.addOfferingGroup("COMPUTE");
    computeItems.forEach((item,index) => {
      const offeringData = mapOtherOfferingFromDTO(
        index + 1,
        item as ComputeEnvironmentInstanceDTO
      );
      this.doSetOtherOfferingData(offeringData);
    });

    this.setCurrentOfferingGroupId("DATABASE");
    const databaseItems = await api.databaseEnvironmentInstanceTable.getQuery(requestConfig);
    if(databaseItems.length > 0)
      this.addOfferingGroup("DATABASE");
    databaseItems.forEach((item,index) => {
      const offeringData = mapOtherOfferingFromDTO(
        index + 1,
        item as DatabaseEnvironmentInstanceDTO
      );
      this.doSetOtherOfferingData(offeringData);
    });

    this.setCurrentOfferingGroupId("STORAGE");
    const storageItems = await api.databaseEnvironmentInstanceTable.getQuery(requestConfig);
    if(storageItems.length > 0)
      this.addOfferingGroup("STORAGE");
    storageItems.forEach((item,index) => {
      const offeringData = mapOtherOfferingFromDTO(
        index + 1,
        item as StorageEnvironmentInstanceDTO
      );
      this.doSetOtherOfferingData(offeringData);
    });

    this.setCurrentOfferingGroupId("GENERAL_XAAS");
    const xaasItems = await api.environmentInstanceTable.getQuery(requestConfig);
    if(xaasItems.length > 0)
      this.addOfferingGroup("GENERAL_XAAS"); 
    xaasItems.forEach((item,index) => {
      const offeringData = mapOtherOfferingFromDTO(
        index + 1,
        item as EnvironmentInstanceDTO
      );
      this.doSetOtherOfferingData(offeringData);
    });

    this.setCurrentOfferingGroupId("");

  }

  @Action
  public async getServiceGroupVerbiageInfo(): Promise<Record<string, string>> {
    return serviceGroupVerbiageInfo[this.currentGroupId];
  }

  // store session properties
  protected sessionProperties: string[] = [
    nameofProperty(this, (x) => x.serviceOfferings),
    nameofProperty(this, (x) => x.serviceOfferingGroups),
    nameofProperty(this, (x)=> x.userSelectedServiceOfferings),
    nameofProperty(this, (x)=> x.DOWObject)
  ];
  
  @Action 
  public async getDOWObject(): Promise<DOWServiceOfferingGroup[]> {
    return this.DOWObject;
  }

  // getters
  public get currentOfferingGroupIndex(): number {
    return this.DOWObject
      .findIndex(group=>group.serviceOfferingGroupId === this.currentGroupId);
  }

  public get currentOfferingIndex(): number {
    const groupIndex = this.currentOfferingGroupIndex;
    const offeringIndex = groupIndex > -1 ? this.DOWObject[groupIndex]
      .serviceOfferings.findIndex(offering=> offering.name 
        === this.currentOfferingName): groupIndex;
    return offeringIndex;
  }

  public get serviceOfferingsForGroup(): DOWServiceOffering[] {
    const groupIndex = this.currentOfferingGroupIndex;
    return groupIndex > -1 ? this.DOWObject[groupIndex].serviceOfferings : [];
  }

  public get validServiceGroups(): DOWServiceOfferingGroup[] {
    return this.DOWObject.filter(
      obj => obj.serviceOfferingGroupId.indexOf("NONE") === -1
    );
  }

  public get isEndOfServiceOfferings(): boolean {
    const offerings =  this.serviceOfferingsForGroup;
    const currentOfferingIndex = offerings
      .findIndex(offering=> offering.name === this.currentOfferingName);
    return (currentOfferingIndex + 1) === offerings.length;
  }

  public get isEndOfServiceGroups(): boolean {
    const groupIndex = this.validServiceGroups
      .findIndex(group=> group.serviceOfferingGroupId === this.currentGroupId);
    return (groupIndex + 1) === this.validServiceGroups.length;
  }

  public get isAtBeginningOfServiceOfferings(): boolean {
    const offerings =  this.serviceOfferingsForGroup;
    const currentOfferingIndex = offerings
      .findIndex(offering=> offering.name === this.currentOfferingName);
    return currentOfferingIndex == 0; 
  }

  public get isAtBeginningOfServiceGroups(): boolean {
    const groupIndex = this.validServiceGroups
      .findIndex(group=> group.serviceOfferingGroupId === this.currentGroupId);
    return groupIndex === 0;

  }

  public get nextServiceOffering(): { name: string, sysId: string} | undefined {
 
    const serviceOfferings = this.serviceOfferingsForGroup;

    if(!serviceOfferings.length)
    {
      return undefined;
    }

    const currentServiceIndex = serviceOfferings
      .findIndex(offering=>offering.name === this.currentOfferingName);

    if(currentServiceIndex < 0)
    {
      throw new Error(`unable to get index for current offer ${this.currentOfferingName}`);
    }

    if((currentServiceIndex + 2) <= serviceOfferings.length )
    {
      const nextOffering = serviceOfferings[currentServiceIndex + 1];
      return { name: nextOffering.name, sysId: nextOffering.sys_id }
    }

    return undefined;
  }

  public get previousServiceOffering(): { name: string, sysId: string } | undefined {

    const serviceOfferings = this.serviceOfferingsForGroup;

    if(!serviceOfferings.length)
    {
      return undefined;
    }

    const currentServiceIndex = serviceOfferings
      .findIndex(offering=>offering.name === this.currentOfferingName);

    if(currentServiceIndex < 0)
    {
      throw new Error(`unable to get index for current offer ${this.currentOfferingName}`);
    }

    if(currentServiceIndex > -1 )
    {
      const serviceIndex = currentServiceIndex > 0 ? currentServiceIndex - 1: currentServiceIndex;
      const nextOffering = serviceOfferings[serviceIndex];
      return { name: nextOffering.name, sysId: nextOffering.sys_id }
    }

    return undefined;
  }

  public get nextOfferingGroup(): string | undefined {
    const currentGroupIndex = this.validServiceGroups
      .findIndex(group=> group.serviceOfferingGroupId === this.currentGroupId);

    if(currentGroupIndex < 0){
      return undefined;
    }

    if((currentGroupIndex + 2) <= this.validServiceGroups.length){
      const nextGroup = this.validServiceGroups[currentGroupIndex + 1].serviceOfferingGroupId;
      return nextGroup;
    }

    return undefined;
  }

  public get lastOfferingGroup(): string | undefined {
    const len = this.validServiceGroups.length;
    return len ? this.validServiceGroups[len - 1].serviceOfferingGroupId : undefined;
  }

  public get prevOfferingGroup(): string | undefined {

    const currentGroupIndex = this.validServiceGroups
      .findIndex(group=> group.serviceOfferingGroupId === this.currentGroupId);

    if(currentGroupIndex < 0){
      return undefined;
    }
  
    const groupIndex = currentGroupIndex > 0 ? currentGroupIndex - 1 :  currentGroupIndex;
    const nextGroup = this.validServiceGroups[groupIndex].serviceOfferingGroupId;
    return nextGroup;
  }

  public get lastOfferingForGroup(): { name: string, sysId: string } | undefined {

    const currentGroupIndex = this.validServiceGroups
      .findIndex(group=> group.serviceOfferingGroupId === this.currentGroupId);

    if(currentGroupIndex < 0){
      return undefined;
    }
  
    const lastOffering =  last(this.validServiceGroups[currentGroupIndex].serviceOfferings);

    return lastOffering 
      ? { name: lastOffering.name, sysId: lastOffering.sys_id } 
      : undefined;
  }

  public get canGetPreviousServiceOffering(): boolean {
    const currentOfferingIndex = this.currentOfferingIndex;
    return currentOfferingIndex >=0;
  }

  public get missingClassificationLevels(): boolean {
    return ClassificationRequirements.selectedClassificationLevels.length === 0;;
  }

  public get selectedServiceOfferingGroups(): string[] {
    return this.DOWObject.map(group=> group.serviceOfferingGroupId);
  }

  public get selectedServiceOfferings(): string[] {
    const currentGroup = this.DOWObject.find(group => 
      group.serviceOfferingGroupId === this.currentGroupId);
    if (currentGroup?.serviceOfferings) {
      return currentGroup.serviceOfferings.flatMap(offering => 
        offering.sys_id === "Other" ? "Other" : offering.name);
    }
    return [""];
  }

  public get otherServiceOfferingEntry(): string {
    const otherServiceOffer = this.serviceOfferingsForGroup
      .find(offering=>offering.sys_id === "Other");
    return otherServiceOffer ? otherServiceOffer.name : "";
  }

  public get currentOfferingGroupHasOfferings(): boolean {
    return this.serviceOfferingsForGroup.length > 0;
  }

  @Mutation
  public checkForXaas(): void {
    if(this.DOWObject){
      let xaasServiceFound = false
      this.DOWObject.forEach((service)=>{
        this.xaasServices.forEach((xaas)=>{
          if(xaas === service.serviceOfferingGroupId){
            xaasServiceFound = true
          }
        })
        this.hasXaasService = xaasServiceFound;
      })
    }
  }

  public summaryBackToContractDetails = false;

  @Mutation
  public setBackToContractDetails(bool: boolean): void {
    this.summaryBackToContractDetails = bool;
  }
  @Action
  public doSetAnticipatedUsersAndDataHasBeenVisited(): void {
    this.setAnticipatedUsersAndDataHasBeenVisited()
  }

  @Mutation
  public setAnticipatedUsersAndDataHasBeenVisited(): void {
    if(!this.hasXaasService){
      this.anticipatedUsersAndDataHasBeenVisited = false;
    }
  }

  @Mutation
  public setIsIncomplete(bool: boolean): void {
    this.isIncomplete = bool;
  }

  @Mutation
  private setInitialized(value: boolean) {
    this.initialized = value;
  }

  @Mutation
  private setServiceOfferings(value: ServiceOfferingDTO[]) {
    this.serviceOfferings = value;
  }

  @Mutation
  public setServiceOfferingGroups(value: SystemChoiceDTO[]) {
    value.forEach((value, index) => {
      // ensure "none apply" options are last in sequence
      value.sequence = value.value.indexOf("NONE") > -1 ? 99 : index + 1;
    });
    this.serviceOfferingGroups = value;
  }

  public currentGroupRemoved = false;
  public currentGroupRemovedForNav = false;
  public lastGroupRemoved = false;

  @Mutation
  public setCurrentGroupRemoved(bool: boolean): void {
    this.currentGroupRemoved = bool;
  }

  @Mutation
  public setCurrentGroupRemovedForNav(bool: boolean): void {
    this.currentGroupRemovedForNav = bool;
  }

  @Mutation
  public setLastGroupRemoved(bool: boolean): void {
    this.lastGroupRemoved = bool;
  }

  @Action
  public async removeCurrentOfferingGroup(): Promise<void> {
    await this.setSelectedOfferings({selectedOfferingSysIds: [], otherValue: ""});
    this.doRemoveCurrentOfferingGroup();
  }

  // removes current offering group if user clicks  the "I don't need these cloud resources"
  // button or does not select any offerings and clicks "Continue" button
  @Mutation
  public doRemoveCurrentOfferingGroup(): void {
    if (!this.currentGroupRemoved) {
      this.currentGroupRemovedForNav = true;    
      const groupIdToRemove = this.currentGroupId;
      const groupIndex = this.DOWObject.findIndex(
        e => e.serviceOfferingGroupId === groupIdToRemove
      );

      const DOWObjectBeforeRemoval = _.clone(this.DOWObject);
      // remove group from DOWObject
      this.DOWObject = this.DOWObject.filter(
        obj => obj.serviceOfferingGroupId !== groupIdToRemove
      );

      const onlyNoneRemain = this.DOWObject.every((e) => {
        return e.serviceOfferingGroupId.indexOf("NONE") > -1;
      });
      // check if last group was removed
      if (groupIndex === DOWObjectBeforeRemoval.length - 1 || onlyNoneRemain) {
        this.lastGroupRemoved = true;
        // set currentGroupId to previous if has one
        if (DOWObjectBeforeRemoval.length > 1 && !onlyNoneRemain) {
          this.currentGroupId = DOWObjectBeforeRemoval[groupIndex -1].serviceOfferingGroupId;

        } else {
          // removed group was last in DOWObject, clear currentGroupId
          this.currentGroupId = "";
        }
      } else {
        this.lastGroupRemoved = false;
        // set currentGroupId to next group in DOWObject
        this.currentGroupId = DOWObjectBeforeRemoval[groupIndex + 1].serviceOfferingGroupId;
      }
      this.currentGroupRemoved = true; 
    }
  }

  @Action
  public async getReturnToDOWSummary(): Promise<boolean> {
    return this.returnToDOWSummary;
  }

  @Mutation
  public setReturnToDOWSummary(bool: boolean): void {
    this.returnToDOWSummary = bool;
  }

  @Mutation
  public setReviewGroupFromSummary(bool: boolean): void {
    this.reviewGroupFromSummary = bool;
  }

  @Mutation
  public setAddGroupFromSummary(bool: boolean): void {
    this.addGroupFromSummary = bool;
  }

  @Mutation
  public addOfferingGroup(groupId: string): void {
    const group = this.serviceOfferingGroups.find(e => e.value === groupId)
    const offeringGroup: DOWServiceOfferingGroup = {
      serviceOfferingGroupId: groupId,
      sequence: group?.sequence || 99,
      serviceOfferings: []
    }
    this.DOWObject.push(offeringGroup);
  }

  @Action
  public async setSelectedOfferingGroups(selectedOfferingGroupIds: string[]): Promise<void> {
    await this.doSetSelectedOfferingGroups(selectedOfferingGroupIds);
    this.checkForXaas()
    this.setAnticipatedUsersAndDataHasBeenVisited()
  }

  @Mutation
  public doSetSelectedOfferingGroups(selectedOfferingGroupIds: string[]): void {
    if (selectedOfferingGroupIds.length) {
      selectedOfferingGroupIds.forEach(async (selectedOfferingGroupId) => {
        if (!this.DOWObject.some(e => e.serviceOfferingGroupId === selectedOfferingGroupId)) {
          const groupIndex = this.DOWObject.findIndex((obj) => {
            return obj.serviceOfferingGroupId === selectedOfferingGroupId
          });
          if (groupIndex === -1) {
            const group = this.serviceOfferingGroups.find(e => e.value === selectedOfferingGroupId)
            const offeringGroup: DOWServiceOfferingGroup = {
              serviceOfferingGroupId: selectedOfferingGroupId,
              sequence: group?.sequence || 99,
              serviceOfferings: []
            }
            this.DOWObject.push(offeringGroup);
          }
        }
        // remove any groups that were previously checked and now unchecked
        this.DOWObject.forEach((offeringGroup, index) => {
          const groupId = offeringGroup.serviceOfferingGroupId;
          if (!selectedOfferingGroupIds.includes(groupId)) {
            this.DOWObject.splice(index, 1);
          }
        });
        this.DOWObject.sort((a, b) => a.sequence > b.sequence ? 1 : -1);
      });
    } else {
      this.DOWObject = [];
    }
    this.currentGroupId = this.DOWObject.length > 0 
      && this.DOWObject[0].serviceOfferingGroupId.indexOf("NONE") === -1 
      ? this.DOWObject[0].serviceOfferingGroupId 
      : "";
    this.currentOfferingName = "";
    this.currentOfferingSysId = "";
  }

  @Action 
  public async setSelectedOfferings(
    { selectedOfferingSysIds, otherValue }: { selectedOfferingSysIds: string[], otherValue: string }
  ): Promise<void> {
    this.doSetSelectedOfferings({ selectedOfferingSysIds, otherValue });
  }

  @Mutation
  public doSetSelectedOfferings(
    { selectedOfferingSysIds, otherValue }: { selectedOfferingSysIds: string[], otherValue: string }
  ): void {
    const groupIndex 
      = this.DOWObject.findIndex((obj) => obj.serviceOfferingGroupId === this.currentGroupId);
    let currentOfferings = this.DOWObject[groupIndex].serviceOfferings;
    if (groupIndex >= 0) {
      if (selectedOfferingSysIds.length === 0) {
        this.DOWObject[groupIndex].serviceOfferings = [];
        currentOfferings = [];
      } else {
        // add selectedOfferings to DOWObject
        selectedOfferingSysIds.forEach((selectedOfferingSysId) => {
          if (!currentOfferings.some((e) => e.sys_id === selectedOfferingSysId)) {
            const foundOffering 
              = this.serviceOfferings.find((e) => e.sys_id === selectedOfferingSysId);
            if (foundOffering || otherValue) {
              const name = foundOffering ? foundOffering.name : otherValue;
              const description = foundOffering ? foundOffering.description : "";
              const sequence = foundOffering ? foundOffering.sequence : "99";

              const offering = {
                name,
                other: otherValue,
                "sys_id": selectedOfferingSysId,
                classificationInstances: [],
                description,
                sequence,
              }
              currentOfferings.push({...offering,serviceId : ""});
            }
          }
        });

        // remove any service offerings previously selected but unchecked this pass
        const currentOfferingsClone = _.cloneDeep(currentOfferings);
        // const currentOfferingsClone = JSON.parse(JSON.stringify(currentOfferings));
        currentOfferingsClone.forEach((offering) => {
          const sysId = offering.sys_id;
          if (!selectedOfferingSysIds.includes(sysId)) {
            const i = currentOfferings.findIndex(e => e.sys_id === sysId);
            currentOfferings.splice(i, 1);
          }
        });

        this.DOWObject[groupIndex].serviceOfferings.sort(
          (a, b) => parseInt(a.sequence) > parseInt(b.sequence) ? 1 : -1
        );

      }
      this.currentOfferingName = currentOfferings.length > 0
        ? currentOfferings[0].name : "";
      this.currentOfferingSysId = currentOfferings.length > 0 
        ? currentOfferings[0].sys_id : "";
    }
  }

  @Action
  public async setOfferingDetails(instancesData: DOWClassificationInstance[]): Promise<void> {
    this.doSetOfferingDetails(instancesData);
  }

  @Mutation
  public doSetOfferingDetails(instancesData: DOWClassificationInstance[]): void {
    const groupIndex = this.DOWObject.findIndex(
      obj => obj.serviceOfferingGroupId === this.currentGroupId
    );
    const offeringIndex = this.DOWObject[groupIndex].serviceOfferings.findIndex(
      obj => obj.sys_id === this.currentOfferingSysId
    );
    this.DOWObject[groupIndex].serviceOfferings[offeringIndex].classificationInstances
      = instancesData;
  }

  // ******************************************************************
  // ******************************************************************
  // BEGIN OtherServiceOfferings - COMPUTE/GENERAL_XAAS/DATABSE - data/methods
  // ******************************************************************
  // ******************************************************************

  currentOtherServiceInstanceNumber = 0;

  emptyOtherOfferingInstance: OtherServiceOfferingData = {
    acquisitionPackageSysId: "",
    instanceNumber: this.currentOtherServiceInstanceNumber,
    environmentType: "",
    classificationLevel: "",
    deployedRegions: [],
    deployedRegionsOther: "",
    descriptionOfNeed: "",
    entireDuration: "",
    periodsNeeded: [],
    operatingSystemAndLicensing: "",
    numberOfVCPUs: "",
    memoryAmount: "",
    memoryUnit: "GB",
    storageType: "",
    storageAmount: "",
    storageUnit: "",
    performanceTier: "",
    performanceTierOther: "",
    numberOfInstancesNeeded: "1",
    requirementTitle: "",   
    usageDescription: "",
    operatingEnvironment: "",
    databaseType: "",
    databaseTypeOther: "",
    licensing: "",
    operatingSystem: "",
    region: "",
    processorSpeed: "",
    networkPerformance: "",
    databaseLicensing: "",
    sysId: "",
    personnelOnsiteAccess: "",
    tsContractorClearanceType: "",
    trainingType: "",
    trainingLocation: "",
    trainingTimeZone: "",
    trainingPersonnel: "",
  }

  otherOfferingInstancesTouched: Record<string, number[]> = {};

  @Action 
  public async getLastOtherOfferingInstanceNumber(): Promise<number> {
    const offeringIndex = this.DOWObject.findIndex(
      o => o.serviceOfferingGroupId.toLowerCase() === this.currentGroupId.toLowerCase()
    );
    if (offeringIndex > -1) {
      const otherOfferingData = this.DOWObject[offeringIndex].otherOfferingData;
      if (otherOfferingData && otherOfferingData.length > 0) {
        const instanceNumbers = otherOfferingData.map(obj => obj.instanceNumber);
        return  Math.max(...instanceNumbers);
      }
    }
    return 1;
  }

  @Action 
  public async setCurrentOtherOfferingInstanceNumber(number: number): Promise<void> {
    this.doSetCurrentOtherOfferingInstanceNumber(number);
  }

  @Mutation 
  public async doSetCurrentOtherOfferingInstanceNumber(number: number): Promise<void> {
    this.currentOtherServiceInstanceNumber = number;
  }

  @Action
  public async getOtherOfferingInstance(instanceNumber: number): Promise<OtherServiceOfferingData> {
    const otherOfferingData = this.otherOfferingObject.otherOfferingData;
    if (otherOfferingData && otherOfferingData.length) {
      const instance = otherOfferingData.find(
        obj => obj.instanceNumber === instanceNumber
      );
      return instance || _.clone(this.emptyOtherOfferingInstance);
    }
    return _.clone(this.emptyOtherOfferingInstance);
  }

  public get otherOfferingObject(): DOWServiceOfferingGroup {
    const currentOfferingId = this.currentGroupId.toLowerCase();
    const offeringIndex = this.DOWObject.findIndex(
      o => o.serviceOfferingGroupId.toLowerCase() === currentOfferingId
    );
    return offeringIndex > -1
      ? this.DOWObject[offeringIndex]
      : { serviceOfferingGroupId: "", sequence: 0, serviceOfferings: [] };
  }

  @Action
  public async pushTouchedOtherOfferingInstance(instanceNumber: number): Promise<void> {
    this.doPushTouchedOtherOfferingInstance(instanceNumber);
  }

  @Mutation
  public doPushTouchedOtherOfferingInstance(instanceNumber: number): void {
    const groupKey: string = this.currentGroupId.toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(this.otherOfferingInstancesTouched, groupKey)) {
      this.otherOfferingInstancesTouched[groupKey] = [];
    }
    this.otherOfferingInstancesTouched[groupKey].push(instanceNumber);
  }

  @Action
  public async setOtherOfferingData(otherOfferingData: OtherServiceOfferingData): Promise<void> {
    const groupId: string = this.currentGroupId.toLowerCase();
    otherOfferingData.acquisitionPackageSysId = AcquisitionPackage.packageId;
    const objSysId = await saveOrUpdateOtherServiceOffering(otherOfferingData, groupId);
    otherOfferingData.sysId = objSysId;
    this.doSetOtherOfferingData(otherOfferingData);
  }

  @Mutation
  public doSetOtherOfferingData(
    otherOfferingData: OtherServiceOfferingData
  ): void {
    const offeringIndex = this.DOWObject.findIndex(
      o => o.serviceOfferingGroupId.toLowerCase() === this.currentGroupId.toLowerCase()
    );

    if (offeringIndex > -1) {
      const otherOfferingObj = this.DOWObject[offeringIndex];
      if (
        otherOfferingObj 
        && Object.prototype.hasOwnProperty.call(otherOfferingObj, "serviceOfferingGroupId")
        && otherOfferingObj.serviceOfferingGroupId
      ) {
        const groupId: string = this.currentGroupId.toLowerCase();
        if (!Object.prototype.hasOwnProperty.call(otherOfferingObj, "otherOfferingData")) {
          otherOfferingObj.otherOfferingData = [];
          otherOfferingObj.otherOfferingData?.push(otherOfferingData);
        } else {
          const instanceNumber = otherOfferingData.instanceNumber;
          const existingInstance = otherOfferingObj.otherOfferingData?.find(
            o => o.instanceNumber === instanceNumber
          );
          if (existingInstance ) {
            Object.assign(existingInstance, otherOfferingData);
          } else {
            otherOfferingObj.otherOfferingData?.push(otherOfferingData);
          }
        }
        
        if (!Object.prototype.hasOwnProperty.call(this.otherOfferingInstancesTouched, groupId)) {
          this.otherOfferingInstancesTouched[groupId] = [];
        }

        if (this.otherOfferingInstancesTouched[groupId]
          .indexOf(otherOfferingData.instanceNumber) === -1) {
          this.otherOfferingInstancesTouched[groupId].push(otherOfferingData.instanceNumber);
        }

        
      } else {
        throw new Error(`Error saving ${this.currentGroupId} data to store`);
      }
    }
  }

  @Action public async getTouchedOtherOfferingInstances(): Promise<number[]> {
    return this.otherOfferingInstancesTouched[this.currentGroupId.toLowerCase()];
  }

  @Action public async hasInstanceBeenTouched(instanceNo: number): Promise<boolean> {
    const groupId = this.currentGroupId.toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(this.otherOfferingInstancesTouched, groupId)) {
      this.otherOfferingInstancesTouched[groupId] = [];
    }

    return this.otherOfferingInstancesTouched[groupId].indexOf(instanceNo) > -1;
  }

  @Action 
  public async getOtherOfferingInstances(): Promise<OtherServiceOfferingData[]> {
    const offeringIndex = this.DOWObject.findIndex(
      o => o.serviceOfferingGroupId.toLowerCase() === this.currentGroupId.toLowerCase()
    );
    if (offeringIndex > -1) {
      const otherOfferingObj = this.DOWObject[offeringIndex];
      if (
        Object.prototype.hasOwnProperty.call(otherOfferingObj, "otherOfferingData")
        && otherOfferingObj.otherOfferingData
        && otherOfferingObj.otherOfferingData.length > 0
      ) {
        return otherOfferingObj.otherOfferingData;
      }
    }
    return [];
  }

  @Action
  public async deleteOtherOfferingInstance(instanceNumber: number): Promise<void> {
    this.doDeleteOtherOfferingInstance(instanceNumber);
  }

  @Mutation
  public doDeleteOtherOfferingInstance(instanceNumber: number): void {
    const otherOfferingId = this.currentGroupId.toLowerCase();
    const offeringIndex = this.DOWObject.findIndex(
      o => o.serviceOfferingGroupId.toLowerCase() === otherOfferingId
    );
    if (offeringIndex > -1) {
      const otherOfferingObj = this.DOWObject[offeringIndex];
      if (
        otherOfferingObj 
        && Object.prototype.hasOwnProperty.call(otherOfferingObj, "otherOfferingData")
        && otherOfferingObj.otherOfferingData
      ) {
        const instanceIndex = otherOfferingObj.otherOfferingData.findIndex(
          obj => obj.instanceNumber === instanceNumber
        );
        otherOfferingObj.otherOfferingData.splice(instanceIndex, 1);
        for (let i = instanceIndex; i < otherOfferingObj.otherOfferingData.length; i++) {
          otherOfferingObj.otherOfferingData[i].instanceNumber 
            = otherOfferingObj.otherOfferingData[i].instanceNumber - 1;
        }
      }
    }
    // remove instanceNumber from touched ones - this.otherOfferingInstancesTouched
    // decrease each instance number after instanceNumber
    const touchedInstances = this.otherOfferingInstancesTouched[otherOfferingId];
    touchedInstances.sort((a, b) => a > b ? 1 : -1);
    const deleteIndex = touchedInstances.indexOf(instanceNumber);
    touchedInstances.splice(deleteIndex, 1);
    this.otherOfferingInstancesTouched[otherOfferingId] 
      = touchedInstances.map(i => i >= deleteIndex + 1 ? i - 1 : i);
  }

  confirmOtherOfferingDelete = false;

  confirmServiceOfferingDelete = false;

  public get confirmServiceOfferingDeleteVal(): boolean {
    return this.confirmServiceOfferingDelete;
  }

  public get confirmOtherOfferingDeleteVal(): boolean {
    return this.confirmOtherOfferingDelete;
  }

  @Action
  public async setConfirmServiceOfferingDelete(bool: boolean): Promise<void> {
    this.doSetConfirmServiceOfferingDelete(bool);
  }
  @Mutation
  public doSetConfirmServiceOfferingDelete(bool: boolean): void {
    this.confirmServiceOfferingDelete = bool;
  }

  @Action
  public setConfirmOtherOfferingDelete(bool: boolean): void {
    this.doSetConfirmOtherOfferingDelete(bool);
  }
  @Mutation
  public doSetConfirmOtherOfferingDelete(bool: boolean): void {
    this.confirmOtherOfferingDelete = bool;
  }

  @Action
  public async deleteOtherOffering(): Promise<void> {
    await this.doDeleteOtherOffering();
    this.checkForXaas()
    this.setAnticipatedUsersAndDataHasBeenVisited()
  }

  @Mutation
  public doDeleteOtherOffering(): void {
    const offeringIndex = this.DOWObject.findIndex(
      o => o.serviceOfferingGroupId.toLowerCase() === this.currentGroupId.toLowerCase()
    );
    if (offeringIndex > -1) {
      this.DOWObject.splice(offeringIndex, 1);
      if (this.DOWObject.length) {

        const nextGroupId = this.DOWObject.length === offeringIndex
          ? this.DOWObject[offeringIndex - 1].serviceOfferingGroupId
          : this.DOWObject[offeringIndex].serviceOfferingGroupId;
        this.currentGroupId = nextGroupId;
      }
    }
  }
  // ******************************************************************
  // ******************************************************************
  // END OtherServiceOfferings - COMPUTE/GENERAL_XAAS/DATABSE - data/methods
  // ******************************************************************
  // ******************************************************************


  @Mutation
  public setCurrentOffering(value: { name: string, sysId: string }): void {
    this.currentOfferingName = value.name;
    this.currentOfferingSysId = value.sysId;
  }

  @Mutation
  public setCurrentOfferingGroupId(value: string): void {
    this.currentGroupId = value;
  }

  @Action
  public async getCurrentOfferingGroupId(): Promise<string> {
    return this.currentGroupId;
  }

  @Action({ rawError: true })
  public async getClassificationInstances(): Promise<DOWClassificationInstance[]> {
    const currentGroup 
      = this.DOWObject.find((obj) => obj.serviceOfferingGroupId === this.currentGroupId);
    const currentOffering
      = currentGroup?.serviceOfferings.find((obj) => obj.name === this.currentOfferingName);
    if (currentOffering && currentOffering.classificationInstances) {
      return currentOffering.classificationInstances;
    }
    return [];
  }

  @Mutation
  public setStoreData(sessionData: string): void {
    try {
      const sessionDataObject = JSON.parse(sessionData);
      Object.keys(sessionDataObject).forEach((property) => {
        Vue.set(this, property, sessionDataObject[property]);
      });
    } catch (error) {
      throw new Error("error restoring session for contact data store");
    }
  }

  @Mutation
  public setUserSelectedServices(value: SelectedServiceOfferingDTO[]): void {
    this.userSelectedServiceOfferings = value;
    storeDataToSession(
      this,
      this.sessionProperties,
      ATAT_DESCRIPTION_OF_WORK_KEY
    );
  }

  @Mutation
  public updateDOWObjectWithSavedIds(values: ServiceOfferingProxy[]): void {

    values.forEach(value=> {
      const data = this.DOWObject[value.dowServiceGroupIndex]
        .serviceOfferings[value.dowServiceIndex];

      //updated classification instances with ids
      data.classificationInstances?.forEach((instance, index)=> {
        const savedInstanceProxy = 
          value.classificationInstances
            .find(cInstance=>cInstance.dowClassificationInstanceIndex === index);
        if(savedInstanceProxy)
        {
          instance.sysId = savedInstanceProxy?.classificationInstance.sys_id;
        }
      })

      //update service instances with ids
      data.serviceId = value.serviceOffering.sys_id || "";
    })

    storeDataToSession(
      this,
      this.sessionProperties,
      ATAT_DESCRIPTION_OF_WORK_KEY
    );
  }


  @Action({ rawError: true })
  public async getServiceOfferingGroups(): Promise<SystemChoiceDTO[]> {
    await this.ensureInitialized();
    return this.serviceOfferingGroups;
  }

  @Action({ rawError: true })
  public async getServiceOfferings(): Promise<DOWServiceOffering[]> {
    await this.ensureInitialized();
    const serviceOfferingsForGroup = this.serviceOfferings.filter((obj) => {
      return obj.service_offering_group === this.currentGroupId;
    })
    //map services offerings from the service offering list
    const serviceOfferings: DOWServiceOffering[] = [];
    const dowOfferings = this.serviceOfferingsForGroup;

    serviceOfferingsForGroup.forEach((obj) => {
      
      //does the saved offering exist in DOW store?
      const savedInDown = dowOfferings.find(offering=>offering.sys_id === obj.sys_id);

      const offering = savedInDown ? savedInDown :{
        name: obj.name,
        "sys_id": obj.sys_id || "",
        sequence: obj.sequence,
        description: obj.description,
        serviceId: "",
      };

      serviceOfferings.push(offering);

    });

    // EJY need to update?
    const groupsWithNoOtherOption = ["ADVISORY", "TRAINING"];
    
    if (groupsWithNoOtherOption.indexOf(this.currentGroupId) === -1) {
      const otherOffering: DOWServiceOffering = {
        name: "Other",
        sys_id: "Other",
        sequence: "99",
        description: "",
        serviceId: "",
      };
      serviceOfferings.push(otherOffering);
    }


    //now map any from the DOW that might've been saved

    serviceOfferings.sort((a, b) => a.sequence > b.sequence ? 1 : -1);
    return serviceOfferings;
  }

  @Action({ rawError: true })
  public getOfferingGroupName(): string {
    const currentGroup = this.serviceOfferingGroups.find((obj) => {
      return obj.value === this.currentGroupId;
    });
    return currentGroup?.label || "";
  }

  @Action({ rawError: true })
  public getServiceOfferingName(): string {
    return this.currentOfferingName;
  }
  
  @Action({ rawError: true })
  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  @Action({ rawError: true })
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    const sessionRestored = retrieveSession(ATAT_DESCRIPTION_OF_WORK_KEY);
    if (sessionRestored) {
      this.setStoreData(sessionRestored);
      this.setInitialized(true);
    } else {
      try {
        await Promise.all([
          this.loadServiceOfferings(),
          this.LoadServiceOfferingGroups(),
        ]);
        storeDataToSession(
          this,
          this.sessionProperties,
          ATAT_DESCRIPTION_OF_WORK_KEY
        );
        this.setInitialized(true);
      } catch (error) {
        console.error(error);
      }
    }
  }

  @Action({ rawError: true })
  public async loadServiceOfferings(): Promise<void> {
    try {
      const serviceOfferings = await api.serviceOfferingTable.all();
      this.setServiceOfferings(serviceOfferings);
    } catch (error) {
      throw new Error(`error loading Service Offerings ${error}`);
    }
  }

  @Action({rawError: true})
  public async LoadServiceOfferingGroups(): Promise<void> {
    try {
      const serviceOfferingGroups = await api.systemChoices
        .getChoices(ServiceOfferingTableName, "service_offering_group");
      this.setServiceOfferingGroups(serviceOfferingGroups);  
    } catch (error) {
      throw new Error(`error loading Service Offering Groups ${error}`);
    }
  }

  @Action({rawError: true})
  public async removeClassificationInstances(classificationInstances:
    string[]): Promise<void>{

    
  
    try {

      const calls:Promise<void>[] = [];
     
      classificationInstances.forEach(instance=> {

        if(instance.length> 0){
          calls.push(api.classificationInstanceTable.remove(instance))
        }
      })
      await Promise.all(calls);
    } catch (error) {
      //do nothing here we'll delete optimistically
    } 
  }

  @Action({rawError: true})
  public async removeUserSelectedService(service: SelectedServiceOfferingDTO): Promise<void>{
    try {
      

      await api.selectedServiceOfferingTable.remove(service.sys_id || "");
     
      const classificationInstances = service.classification_instances.split(',');

      if(classificationInstances && classificationInstances.length)
      {
        await this.removeClassificationInstances(classificationInstances);
      }
  
    } catch (error) {
      //do nothing here we'll delete optimistically
    }
  }

  @Action({rawError: true})
  public async removeUserSelectedServices(requiredServices: SelectedServiceOfferingDTO[])
 : Promise<void>{
    try {

      const calls = requiredServices.reduce<Promise<void>[]>((previous, current)=>  {
        const values = [...previous];

        if(current.sys_id){
          values.push(this.removeUserSelectedService(current));
        }
        return values;

      }, []);
      await Promise.all(calls);
       
    } catch (error) {
      //to nothing here we're deleting stuff optimistically
    }
  }

  @Action({rawError: true})
  public async saveClassificationInstance(data: 
    ClassificationInstanceProxy):Promise<ClassificationInstanceProxy>{
    const sysId = data.classificationInstance.sys_id;
    const { classification_level, need_for_entire_task_order_duration, 
      selected_periods, usage_description, } = data.classificationInstance;
    const saveClassificationInstance = (sysId && sysId.length > 0) ? 
      api.classificationInstanceTable.update(sysId, {
        classification_level,
        need_for_entire_task_order_duration,
        selected_periods,
        usage_description
      }) : 
      api.classificationInstanceTable.create({
        classification_level,
        need_for_entire_task_order_duration,
        selected_periods,
        usage_description
      });
    const savedClassificationInstance =  await saveClassificationInstance;
    data.classificationInstance = savedClassificationInstance;
   
    return data;
  }

  @Action({rawError: true})
  public async saveclassificationInstances(data: ClassificationInstanceProxy[]):
   Promise<ClassificationInstanceProxy[]>{
 
    try {
       
      //create a save call for each classification instance
      const calls = data.map(instance=> this.saveClassificationInstance(instance));
      const savedInstances = await Promise.all(calls);
      return savedInstances;
       
    } catch (error) {
      throw new Error(`error saving classification instances ${error}`);
       
    }
    
  }


  @Action({rawError: true})
  public async saveUserService(serviceProxy: ServiceOfferingProxy): Promise<ServiceOfferingProxy>{

    try {
      let savedClassificationInstances: ClassificationInstanceProxy[] = [];

      //first save classification instances
      if(serviceProxy.classificationInstances.length)
      {
        savedClassificationInstances = 
      await this.saveclassificationInstances(serviceProxy.classificationInstances);
      }
      
      //save service instance
      serviceProxy.serviceOffering.classification_instances = 
      savedClassificationInstances
        .map(instance=> instance.classificationInstance.sys_id || "").join(',') || "";

      const apiTable = api.selectedServiceOfferingTable;

      const saveService = serviceProxy.serviceOffering.sys_id ? 
        apiTable.update(serviceProxy.serviceOffering.sys_id || "", serviceProxy.serviceOffering)
        : apiTable.create(serviceProxy.serviceOffering);
      
      const savedService = await saveService;
      
      serviceProxy.classificationInstances = savedClassificationInstances;
      serviceProxy.serviceOffering = savedService;
     
      return serviceProxy;

    } catch (error) {
      
      throw new Error( `error occurred while saving service proxy`)
    }

  }

  @Action({rawError: true})
  public async saveUserServices(serviceProxies: ServiceOfferingProxy[]): Promise<void>{

    try {
      const calls = serviceProxies.map(proxy=> this.saveUserService(proxy));
      const savedProxies = await Promise.all(calls);
      
      //update dow object with saved ids
      this.updateDOWObjectWithSavedIds(savedProxies);
      const savedServices = savedProxies.map(proxy=> proxy.serviceOffering);
      this.setUserSelectedServices(savedServices);
      
    } catch (error) {
      console.error(error);
      throw new Error(`error occurred saving services ${error}`);
    }
  }

  //synchronizes back end with DOW
  @Action({rawError: true})
  public async saveUserSelectedServices(): Promise<void>{
    try {
      const requiredServices = this.userSelectedServiceOfferings;
      const dowOfferingGroups = this.DOWObject;

      //grab all of the selected services in the dow object
      //build a list of Service Proxy items

      //grab all of the selected services in the dow object
      const serviceOfferingProxies: ServiceOfferingProxy[] = [];

      dowOfferingGroups.forEach((group, groupIndex)=> {
        group.serviceOfferings.forEach((offering, offeringIndex)=> {
          serviceOfferingProxies.push(
            mapDOWServiceOfferingToServiceProxy(offering, groupIndex, offeringIndex));
        });
      });

      const unsavedServices = serviceOfferingProxies
        .filter(proxy=>(proxy.serviceOffering.sys_id === undefined || 
        proxy.serviceOffering.sys_id.length === 0));

      const savedServices = serviceOfferingProxies
        .filter(proxy=>proxy.serviceOffering.sys_id?.length);

      const servicesToRemove: SelectedServiceOfferingDTO[] = [];

      if(requiredServices.length)
      {
      //get services to delete - delete all of the service offerings
      //that are no longer in the dow object
        requiredServices.forEach(service=> {

          const inSaved = savedServices
            .find(saved=> saved.serviceOffering.sys_id === service.sys_id);
          if(!inSaved){
            servicesToRemove.push(service);
          }
        });
   
        if(servicesToRemove.length){
          await this.removeUserSelectedServices(servicesToRemove);
        }
      }

      //get all of the services that haven't been removed for updating
      const servicesToUpdate = differenceWith<ServiceOfferingProxy, SelectedServiceOfferingDTO>
      (savedServices, servicesToRemove, ({serviceOffering}, selected)=> 
        serviceOffering.service_offering === selected.service_offering);

      const servicesTosave: ServiceOfferingProxy[] = [...servicesToUpdate, ...unsavedServices];
      await this.saveUserServices(servicesTosave);
     
    } catch (error) {
      console.error(error);
      throw new Error(`error persisting services ${error}`);
    }
    
  }

  @Action({rawError: true})
  public async reset(): Promise<void> {
    sessionStorage.removeItem(ATAT_DESCRIPTION_OF_WORK_KEY);
    this.doReset();
  }

  @Mutation
  private doReset(): void {
    this.summaryBackToContractDetails = false;
    this.currentGroupRemoved = false;
    this.currentGroupRemovedForNav = false;
    this.lastGroupRemoved = false;
    this.initialized = false;
    this.isIncomplete = true;
    this.serviceOfferings = [];
    this.serviceOfferingGroups = [];
    this.DOWObject = [];
    this.userSelectedServiceOfferings = [];
    this.currentGroupId = "";
    this.currentOfferingName = "";
    this.currentOfferingSysId = "";
    this.xaaSNoneValue = "XaaS_NONE";
    this.cloudNoneValue = "Cloud_NONE";
    this.returnToDOWSummary = false;
    this.reviewGroupFromSummary = false;
    this.addGroupFromSummary = false;
    this.currentOtherServiceInstanceNumber = 0;
    this.otherOfferingInstancesTouched = {};
    this.confirmOtherOfferingDelete = false;
    this.confirmServiceOfferingDelete = false;
  }
}

const DescriptionOfWork = getModule(DescriptionOfWorkStore);
export default DescriptionOfWork;
