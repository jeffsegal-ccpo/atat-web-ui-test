/* eslint-disable camelcase */

import Vuex, { Store } from 'vuex';
import { createLocalVue, createWrapper } from '@vue/test-utils';
import {FundingAlertTypes, PortfolioDataStore,
  getThresholdAmount, thresholdAtOrAbove} from "@/store/portfolio/index";
import { getModule } from 'vuex-module-decorators';
import storeHelperFunctions  from "../helpers";
import Vue from "vue";
import AcquisitionPackage, { StatusTypes } from "@/store/acquisitionPackage";
import { AlertDTO } from '@/api/models';
import { MemberInvites } from 'types/Global';
const localVue = createLocalVue();
localVue.use(Vuex);


describe("Portfolio Store", () => {
  let portfolioStore: PortfolioDataStore;

  beforeEach(() => {
    const createStore = (storeOptions: any = {}):
        Store<{ portfolio: any }> => new Vuex.Store({ ...storeOptions });
    portfolioStore = getModule(PortfolioDataStore, createStore());
    AcquisitionPackage.setProjectOverview({
      title: "",
      scope: "",
      emergency_declaration:""
    })
    AcquisitionPackage.setOrganization({})
    AcquisitionPackage.setAcquisitionPackage({
      classification_level: "",
      contact: "",
      contract_considerations: "",
      contract_type: "",
      current_contract: "",
      current_environment: "",
      docusign_envelope_id: "",
      environment_instance: "",
      fair_opportunity: "",
      funding_plans: "",
      gfe_overview: "",
      number: "",
      organization: "",
      period_of_performance: "",
      periods: "",
      project_overview: "",
      required_services: "",
      requirements_const_estimate: "",
      sensitive_information: "",
      status: "",
      sys_created_by: "",
      sys_created_on: "",
      sys_updated_on: ""
    })
  })
  afterEach(()=>{
    jest.clearAllMocks();
    jest.clearAllTimers();
  })

  it('Test setInitialized()- sets initialized to true', async () => {
    //mocks sessionStorage retrieval
    jest.spyOn(storeHelperFunctions, "retrieveSession").mockReturnValue(
      JSON.stringify({
        "clins": "",
      })
    );
    await portfolioStore.initialize();
    expect(portfolioStore.initialized).toBe(true)
    expect(portfolioStore.currentPortfolio.title).toBe("Mock Title")
  })

  it('Test initialize()- sets portfolio to the AcquisitionPackage data', async () => {

    AcquisitionPackage.setProjectOverview({
      title: "test title",
      scope: "testing scope",
      emergency_declaration:""
    })
    AcquisitionPackage.setOrganization({agency: "FBI"})
    AcquisitionPackage.setAcquisitionPackage({
      classification_level: "",
      contact: "",
      contract_considerations: "",
      contract_type: "",
      current_contract: "",
      current_environment: "",
      docusign_envelope_id: "",
      environment_instance: "",
      fair_opportunity: "",
      funding_plans: "",
      gfe_overview: "",
      number: "",
      organization: "",
      period_of_performance: "",
      periods: "",
      project_overview: "",
      required_services: "",
      requirements_const_estimate: "",
      sensitive_information: "",
      status: "",
      sys_created_by: "Johnnny test",
      sys_created_on: "Today",
      sys_updated_on: "Tomorrow"})

    await portfolioStore.initialize();
    Vue.nextTick(() => {
      expect(portfolioStore.currentPortfolio.createdBy).toBe("Johnnny test")
    })
  })

  it('Test setPortfolioData- sets portfolio to the passed in value', async () => {
    const mockData = {
      title: "some title to test",
      description: "a description",
      status: "active",
      csp: "",
      agency: "mock Agency",
      createdBy: "jefferey tester",
      provisioned: "today",
      members: []
    }
    const updateEmailObj = {
      members:[{email:"testemail@test.mil"}]
    }
    
    await portfolioStore.setPortfolioData(mockData);
    await portfolioStore.setPortfolioData(updateEmailObj);
    expect(portfolioStore.currentPortfolio.title).toBe("some title to test")
  })

  it('getStatus() returns default result', async()=>{
    expect(await portfolioStore.getStatus).toBe(StatusTypes.Active);
  })

  it('getShowAddMembersModal() returns default result', async()=>{
    expect(await portfolioStore.getShowAddMembersModal).toBe(false);
  })

  it('setShowAddMembersModal() returns default result', async()=>{
    await portfolioStore.setShowAddMembersModal(false)
    expect(await portfolioStore.showAddMembersModal).toBe(false);
  })

  it('Test setStoreData- sets portfolio to the passed in value', async () => {
    const mockData = {
      title: "some title to test",
      description: "a description",
      status: "active",
      csp: "",
      agency: "mock Agency",
      createdBy: "jefferey tester",
      provisioned: "today",
      members: []
    }

    await portfolioStore.setStoreData(JSON.stringify(mockData));
    Vue.nextTick(() => {
      expect(portfolioStore.currentPortfolio.title).toBe("some title to test")
    })
  })

  it('Test getFundingTrackerAlerts', async () => {
    const mockAlerts: AlertDTO[] = [
      {
        clin: "",
        task_order: "tsk_12345678",
        active: "true",
        alert_type: "SPENDING_ACTUAL",
        threshold_violation_amount: "75",
        last_notification_date: "",
        portfolio: "",
      },
      {
        clin: "",
        task_order: "tsk_12345678919",
        active: "true",
        alert_type: "TIME_REMAINING",
        threshold_violation_amount: "60",
        last_notification_date: "",
        portfolio: "",
      },
    ];
    
    jest.spyOn(portfolioStore, "getAlerts").mockReturnValue(
      new Promise(resolve=>resolve(mockAlerts))
    );
    const fundingAlertData = await portfolioStore.getFundingTrackerAlert('');
    Vue.nextTick(() => {
      expect(fundingAlertData.fundingAlertType).toBe(FundingAlertTypes.POPExpiresSoonWithLowFunds);
      expect(fundingAlertData.hasLowFundingAlert).toBe(true);
      expect(fundingAlertData.daysRemaining).toBe(60);
      expect(fundingAlertData.spendingViolation).toBe(75);
    })
  })

  it('Test setStatus- sets portfolio status to the passed in value', async () => {
    portfolioStore.setStatus(StatusTypes.Delinquent);
    Vue.nextTick(() => {
      expect(portfolioStore.status).toBe(StatusTypes.Delinquent);
    })
  })

  it('Test setAlerts- sets alerts to the passed in value', async () => {
    const mockAlerts: AlertDTO[] = [
      {
        clin: "",
        task_order: "tsk_12345678",
        active: "true",
        alert_type: "SPENDING_ACTUAL",
        threshold_violation_amount: "75",
        last_notification_date: "",
        portfolio: "",
      },
      {
        clin: "",
        task_order: "tsk_12345678919",
        active: "true",
        alert_type: "TIME_REMAINING",
        threshold_violation_amount: "60",
        last_notification_date: "",
        portfolio: "",
      },
    ];
    portfolioStore.setAlerts(mockAlerts);
    Vue.nextTick(() => {
      expect(portfolioStore.alerts).toBe(mockAlerts);
    })
  })

  it('Test getFundingTrackerAlerts Alerts Detect Delinquint', async () => {
    const mockAlerts: AlertDTO[] = [
      {
        clin: "",
        task_order: "tsk_12345678",
        active: "true",
        alert_type: "SPENDING_ACTUAL",
        threshold_violation_amount: "100",
        last_notification_date: "",
        portfolio: "",
      }
    ];
    
    jest.spyOn(portfolioStore, "getAlerts").mockReturnValue(
      new Promise(resolve=>resolve(mockAlerts))
    );
    const fundingAlertData = await portfolioStore.getFundingTrackerAlert('');
    Vue.nextTick(() => {
      expect(fundingAlertData.fundingAlertType).toBe(FundingAlertTypes.POPFundsAt100Percent);
      expect(fundingAlertData.hasLowFundingAlert).toBe(true);
    })
  })

  it('saveMembers() add members to Portfolio.portflio.members', async()=>{
    const memberInvites: MemberInvites = {
      emails:["dummyemail01@mail.mil", "dummyemail02@mail.mil"],
      role: "Viewer"
    } 
    portfolioStore.currentPortfolio.members = [];
    await portfolioStore.saveMembers(memberInvites)
    expect(portfolioStore.currentPortfolio.members?.length).toBe(2)
  })

  it('getPortolioData()', async()=>{
    const dummyTitle = "dummy Title";
    portfolioStore.setPortfolioData(
      {
        title: dummyTitle
      }
    )
    const portfolio = await portfolioStore.getPortfolioData();
    expect(portfolio.title).toBe(dummyTitle)
  })

  it('Test getFundingTrackerAlerts Alerts Detect Expired', async () => {
    const mockAlerts: AlertDTO[] = [
      {
        clin: "",
        task_order: "tsk_12345678919",
        active: "true",
        alert_type: "TIME_REMAINING",
        threshold_violation_amount: "-30",
        last_notification_date: "",
        portfolio: "",
      },
    ];
    
    jest.spyOn(portfolioStore, "getAlerts").mockReturnValue(
      new Promise(resolve=>resolve(mockAlerts))
    );
    const fundingAlertData = await portfolioStore.getFundingTrackerAlert('');
    Vue.nextTick(() => {
      expect(fundingAlertData.fundingAlertType).toBe(FundingAlertTypes.POPExpired);
      expect(fundingAlertData.hasLowFundingAlert).toBe(true);
    })
  })

  it('Test getThreshold Amount', async () => {
    const spendingViolation = "75%";
    const amount = getThresholdAmount(spendingViolation);
    expect(amount).toBe(75);
  })

  
  it('Test thresholdAtOrAbove or above Amount', async () => {
    const spendingViolation = "75%";
    const metThreshold = thresholdAtOrAbove(spendingViolation, 75);
    expect(metThreshold).toBe(true);
  })

})


