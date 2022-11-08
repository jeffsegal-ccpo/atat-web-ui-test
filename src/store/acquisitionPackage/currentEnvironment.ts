/* eslint-disable camelcase */
import {Action, getModule, Module, Mutation, VuexModule} from "vuex-module-decorators";
import rootStore from "@/store";
import {CurrentEnvironmentDTO} from "@/api/models";
import {nameofProperty, retrieveSession, storeDataToSession} from "@/store/helpers";
import Vue from "vue";
import {api} from "@/api";

const ATAT_CURRENT_ENVIRONMENT_KEY = "ATAT_CURRENT_ENVIRONMENT_KEY";

/**
 * This module contains all the store and api support that is needed for "Background -
 * current environment" of a new Acquisition
 */
@Module({
  name: "CurrentEnvironmentStore",
  namespaced: true,
  dynamic: true,
  store: rootStore,
})

export class CurrentEnvironmentStore extends VuexModule {
  initialized = false;
  currentEnvironment: CurrentEnvironmentDTO | null = null;

  @Action
  public async getCurrentEnvironment():
    Promise<CurrentEnvironmentDTO | null> {
    return this.currentEnvironment;
  }

  protected sessionProperties: string[] = [
    nameofProperty(this, (x) => x.currentEnvironment)
  ];

  @Mutation
  public setStoreData(sessionData: string): void {
    try {
      const sessionDataObject = JSON.parse(sessionData);
      Object.keys(sessionDataObject).forEach((property) => {
        Vue.set(this, property, sessionDataObject[property]);
      });
    } catch (error) {
      throw new Error("error restoring session for acquisition package summary data store");
    }
  }

  @Mutation
  public setInitialized(value: boolean): void {
    this.initialized = value;
  }

  @Mutation
  public setCurrentEnvironment(value: CurrentEnvironmentDTO): void {
    this.currentEnvironment = value;
    storeDataToSession(
      this,
      this.sessionProperties,
      ATAT_CURRENT_ENVIRONMENT_KEY
    );
  }

  @Action({rawError: true})
  async initialize(): Promise<void> {
    if (!this.initialized) {
      const sessionRestored = retrieveSession(ATAT_CURRENT_ENVIRONMENT_KEY);
      if (sessionRestored) {
        this.setStoreData(sessionRestored);
      } else {
        this.setInitialized(true);
        storeDataToSession(this, this.sessionProperties, ATAT_CURRENT_ENVIRONMENT_KEY);
      }
    }
  }

  @Action({rawError: true})
  async ensureInitialized(): Promise<void> {
    await this.initialize();
  }

  /**
   * Loads the current environment by making BE api calls and sets it to this store
   */
  @Action({rawError: true})
  async loadCurrentEnvironment(currentEnvironmentSysId: string | null): // TODO: remove null
    Promise<CurrentEnvironmentDTO | undefined> {
    try {
      // FIXME: remove below line after acquisition package store starts passing correct id
      currentEnvironmentSysId = currentEnvironmentSysId ?
        currentEnvironmentSysId : "039f0c7687e59150bc86b889cebb357d"; // pragma: allowlist secret
      const currentEnvironmentDTO = await api.currentEnvironmentTable
        .retrieve(currentEnvironmentSysId);
      // TODO: add orchestration to load data from other tables
      this.setCurrentEnvironment(currentEnvironmentDTO);
      return Promise.resolve(currentEnvironmentDTO);
    } catch (error) {
      throw new Error(`an error occurred while loading current environment ${error}`);
    }
  }

  /**
   * Gets the current environment from this store and makes the api calls to save.
   */
  @Action({rawError: true})
  async saveCurrentEnvironment(): Promise<boolean> {
    // TODO: map the store object to the DB tables and make proper API calls to either
    //  create or update the current environment.
    try {
      let isSaveSuccessfull = false;
      if (this.currentEnvironment) {
        // TODO: update or create
        isSaveSuccessfull = true;
      }
      return isSaveSuccessfull;
    } catch (error) {
      throw new Error(`an error occurred saving current environment ${error}`);
    }
  }
}

const CurrentEnvironment = getModule(CurrentEnvironmentStore);
export default CurrentEnvironment;
