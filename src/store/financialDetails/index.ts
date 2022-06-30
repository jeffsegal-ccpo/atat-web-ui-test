import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";
import rootStore from "../index";

import { 
  baseGInvoiceData, 
  fundingIncrements, 
  IFPData,  
} from "types/Global";
import { nameofProperty, retrieveSession, storeDataToSession } from "../helpers";
import Vue from "vue";
import { TaskOrderDTO } from "@/api/models";
import api from "@/api";

const ATAT_FINANCIAL_DETAILS__KEY = "ATAT_FINANCIAL_DETAILS__KEY";


@Module({
  name: 'FinancialDetails',
  namespaced: true,
  dynamic: true,
  store: rootStore
})

export class FinancialDetailsStore extends VuexModule {
  
  initialized = false;

  estimatedTaskOrderValue: string | null =  null;
  fundingRequestType: string | null =  null;
  miprNumber: string | null = null;
  initialFundingIncrementStr = "";
  initialFundingIncrement = 0; // EJY save number or string in store?
  fundingIncrements: fundingIncrements[] = [];

  useGInvoicing = "";
  gInvoiceNumber = "";

  gtcNumber: string | null = null;
  orderNumber: string | null = null;
  taskOrder: TaskOrderDTO | null = null;


  // store session properties
  protected sessionProperties: string[] = [
    nameofProperty(this, (x) => x.estimatedTaskOrderValue),
    nameofProperty(this, (x) => x.fundingRequestType),
    nameofProperty(this, (x)=> x.initialFundingIncrement),
    nameofProperty(this, (x)=> x.initialFundingIncrementStr),
    nameofProperty(this, (x)=> x.fundingIncrements),
    nameofProperty(this, (x)=> x.gtcNumber),
    nameofProperty(this, (x)=> x.orderNumber),
    nameofProperty(this, (x) => x.useGInvoicing),
    nameofProperty(this, (x) => x.gInvoiceNumber),      
  ];
  
  @Action({ rawError: true })
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    const sessionRestored = retrieveSession(ATAT_FINANCIAL_DETAILS__KEY);
    if (sessionRestored) {
      this.setStoreData(sessionRestored);
      this.setInitialized(true);
    }
  }

  @Action
  public async getGInvoiceData(): Promise<baseGInvoiceData> {
    return {
      useGInvoicing: this.useGInvoicing,
      gInvoiceNumber: this.gInvoiceNumber,
    }
  }

  @Mutation
  public async saveGInvoiceData(data: baseGInvoiceData): Promise<void> {
    this.useGInvoicing = data.useGInvoicing;
    this.gInvoiceNumber = data.gInvoiceNumber;
    storeDataToSession(
      this,
      this.sessionProperties,
      ATAT_FINANCIAL_DETAILS__KEY
    );

    return;
  }


  @Action
  public async getIFPData(): Promise<IFPData> {
    return {
      initialFundingIncrementStr: this.initialFundingIncrementStr,
      fundingIncrements: this.fundingIncrements,
    }
  }

  @Mutation
  public async setIFPData(data: IFPData): Promise<void> {
    this.initialFundingIncrementStr = data.initialFundingIncrementStr;
    this.fundingIncrements = data.fundingIncrements;

    storeDataToSession(
      this,
      this.sessionProperties,
      ATAT_FINANCIAL_DETAILS__KEY
    );
  }

  @Action
  public async save7600({gtcNumber, orderNumber}: {gtcNumber: string, 
    orderNumber: string}): Promise<void> {
    this.setGTCNumber(gtcNumber);
    this.setOrderNumber(orderNumber);
  }

  @Action
  public async load7600():Promise<{gtcNumber: string, 
    orderNumber: string}>{

    return {
      gtcNumber: this.gtcNumber || "",
      orderNumber: this.orderNumber || ""
    }
  }

  @Action
  public async getMIPRNumber(): Promise<string>  {
    return this.miprNumber || '';
  }

  @Mutation
  public setEstimatedTaskOrderValue(value: string): void {
    this.estimatedTaskOrderValue = value;

    storeDataToSession(
      this,
      this.sessionProperties,
      ATAT_FINANCIAL_DETAILS__KEY
    );
  }

  @Mutation
  public setMIPRNumber(value: string): void {
    this.miprNumber = value;

    storeDataToSession(
      this,
      this.sessionProperties,
      ATAT_FINANCIAL_DETAILS__KEY
    );
  }

  @Mutation
  public setFundingRequestType(value: string): void {
    this.fundingRequestType = value;

    storeDataToSession(
      this,
      this.sessionProperties,
      ATAT_FINANCIAL_DETAILS__KEY
    );
  }

  @Mutation
  public setGTCNumber(value: string): void {
    this.gtcNumber = value;

    storeDataToSession(
      this,
      this.sessionProperties,
      ATAT_FINANCIAL_DETAILS__KEY
    );
  }

  @Mutation
  public setOrderNumber(value: string): void {
    this.orderNumber = value;

    storeDataToSession(
      this,
      this.sessionProperties,
      ATAT_FINANCIAL_DETAILS__KEY
    );
  }

  @Mutation
  private setInitialized(value: boolean) {
    this.initialized = value;
  }

  @Mutation
  public setStoreData(sessionData: string): void {
    try {
      const sessionDataObject = JSON.parse(sessionData);
      Object.keys(sessionDataObject).forEach((property) => {
        Vue.set(this, property, sessionDataObject[property]);
      });

    } catch (error) {
      throw new Error("error saving session data");
    }
  }

}

const FinancialDetails = getModule(FinancialDetailsStore);
export default FinancialDetails;
