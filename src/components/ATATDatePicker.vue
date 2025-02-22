
<template>
  <div :id="id + 'DatePickerContainer'" class="atat-date-picker">
    <v-menu
      ref="atatDatePickerMenu"
      v-model="menu"
      min-width="auto"
      nudge-bottom="getMenuTop"
      :attach="'#' + id + 'DatePickerContainer'"
      absolute
      :nudge-top="0"
      :nudge-left="0"
      
    >
      <template v-slot:activator="{ on, attrs }">
        <div class="d-flex align-center mb-2" v-if="label">
          <label
            :id="id + 'DatePickerLabel'"
            class="form-field-label mr-1"
            :for="id + 'DatePickerTextField'"
          >
            {{ label }}
            <span v-if="optional" class="optional"> Optional </span>
          </label>
          <ATATTooltip
            :tooltipText="tooltipText"
            :tooltipTitle="tooltipTitle"
            :id="id"
            :label="label"
          />
        </div>
        <v-text-field
          ref="atatDatePicker"
          :id="id + 'DatePickerTextField'"
          :height="42"
          :placeholder="placeHolder"
          class="text-primary _input-max-width d-flex align-center"
          :hide-details="true"
          outlined
          @input="onInput"
          v-model="dateFormatted"
          :style="'width: ' + width + 'px'"
          dense
          v-bind="attrs"
          v-on="on"
          :rules="rules"
          @blur="onBlur($event)"
          @focus ="onFocus($event)"
          @keypress:enter="menu=false"
          :validate-on-blur="validateOnBlur"
          autocomplete="off"
        >
          <template slot="append-outer">
            <v-btn
              icon
              tabindex="-1"
              :id="id + 'DatePickerButton'"
              aria-label="Open calendar to select date"
              @click="toggleMenu"
              class="pa-0 icon-28 ml-2"
            >
              <v-icon
                :id="id + 'DatePickerButtonIcon'"
                class="icon-28 text-base-darkest"
              >
                calendar_today
              </v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </template>
      <v-date-picker
        :id="id + 'DatePicker'"
        v-model="date"
        :show-adjacent-months="showAdjacentMonths"
        no-title
        :active-picker.sync="activePicker"
        type="date"
        :min="min"
        :max="max"
        @click:date="datePickerClicked"
        @keypress:enter="onBlur()"
        scrollable
      ></v-date-picker>
    </v-menu>
    <ATATErrorValidation v-if="menu === false && showErrors" :errorMessages="errorMessages" />
  </div>
</template>
<script lang="ts">
import { Component, Prop, Watch } from "vue-property-decorator";
import Vue from "vue";
import { add, format, formatISO, isValid, parseISO } from "date-fns";
import ATATTooltip from "@/components/ATATTooltip.vue";
import ATATErrorValidation from "@/components/ATATErrorValidation.vue";
import AcquisitionPackage from "@/store/acquisitionPackage";

@Component({
  components: {
    ATATTooltip,
    ATATErrorValidation,
  },
})
export default class ATATDatePicker extends Vue {
  // refs
  $refs!: {
    atatDatePicker: Vue & { 
      errorBucket: string[]; 
      errorCount: number; 
      validate: () => boolean;
      value: string;
      resetValidation: ()=> boolean;
    };
    atatDatePickerMenu: Vue & {
      save: (selectedDate: string) => Record<string, never>;
    };
  };

  /**
   * DATA
   */
  private date = "";
  private dateFormatted = "";
  private menu = false;
  private errorMessages: string[] = [];
  private activePicker = "";

  // Flash of red border on date text field when validateOnBlur is true and user
  // clicks a date in the picker to be addressed in future milestone.
  // Leave commented out code for validateOnBlur in place for now.
  private validateOnBlur = true;

  @Prop({ default: "" }) private label!: string;
  @Prop({ default: "" }) private id!: string;
  @Prop({ default: "" }) private value!: string;
  @Prop({ default: false }) private optional!: boolean;
  @Prop({ default: "" }) private placeHolder!: string;
  @Prop({ default: false }) private showAdjacentMonths!: boolean;
  @Prop({ default: "220" }) private width!: string;
  @Prop({ default: "" }) private helpText!: string;
  @Prop({ default: "" }) private tooltipTitle!: string;
  @Prop({ default: "" }) private tooltipText!: string;
  @Prop({ default: format(new Date(), "yyyy-MM-dd") }) private min!: string;
  @Prop({ default: format(add(new Date(), { years: 1 }), "yyyy-MM-dd") }) private max!: string;
  @Prop({ default: () => [] }) private rules!: Array<unknown>;
  @Prop({ default: false }) private isRequired!: boolean;
  @Prop({ default: true }) private showErrors!: boolean;

  /**
   * WATCHERS
   */
  @Watch("date")
  protected formatDateWatcher(): void {
    this.dateFormatted = this.reformatDate(this.date);
  }

  @Watch("value")
  public async valueChanged(): Promise<void> {
    await this.setDateFromValue();
  }

  /**
   * restores standar calendar view when popup menu is displayed
   * if previous view was month or year view
   */

  @Watch("menu")
  protected showStandardCalendar(val: boolean): void {
    if (val) {
      setTimeout(()=>(this.activePicker = "DATE"));
    } else {
      this.$refs.atatDatePicker.validate();
    }
  }

  /**
   * EVENTS
   */

  /**
   * onBlur event of the textbox.
   *
   * if textbox value is a valid date
   * [x] reformat textbox value date for datepicker
   * [x] update date value property
   * [x] remove any errors
   */

  private onBlur(): void {
    if (isValid(new Date(this.dateFormatted))) {
      this.date = this.reformatDate(this.dateFormatted);
      this.updateDateValueProperty();
      this.removeErrors();
    }
    Vue.nextTick(() => {
      this.$refs.atatDatePicker.validate()
      this.setErrorMessage();
      this.additionalValidateActions("textbox");
    });
  }

  private onFocus(): void {
    this.menu = false;
  }

  /**
   * sets validateOnBlur to true while user is typing
   * so as validation occurs only onBlur
   *
   * if textbox is cleared manually, resets necessary
   * date attribs
   */
  private onInput(date: string): void {
    // this.validateOnBlur = true;
    if (date === "") {
      this.dateFormatted = "";
      this.date = "";
      this.menu = false;
    }
  }

  /**
   * @param selectedDate (string) - selected Datepicker date
   */
  private datePickerClicked(selectedDate: string): void {
    //must be set to false to prevent unnecessary validation
    // this.validateOnBlur = false;
   
    this.removeErrors();

    // saves selectedDate to necessary atatDatePickerMenu attribs
    this.$refs.atatDatePickerMenu.save(selectedDate);

    Vue.nextTick(() => {
      this.updateDateValueProperty();
      this.additionalValidateActions("datepicker");
    });
  }

  /**
   * emits 'update:date' value when dp is clicked or
   * textbox value is changed
   */
  private updateDateValueProperty(): void {
    if (isValid(new Date(this.dateFormatted))) {
      this.$emit("update:value", this.dateFormatted);
    } 
  }

  private additionalValidateActions(src: string): void{
    this.$refs.atatDatePicker.validate();
    this.$nextTick(()=>{
      // no errors are to be generated from clicking on the 
      // datepicker picker/menu
      const errors = this.$refs.atatDatePicker.errorBucket
      this.$refs.atatDatePicker.errorBucket = !this.menu 
        ? errors
        : [];
      this.$emit("hasErrorMessages", errors );
    })
  }


  /**
   * utility function that removes errors from
   * Vuetify's errorBucket & this.errorMessages
   */
  private removeErrors(): void {
    this.$refs.atatDatePicker.errorBucket = [];
    this.errorMessages = [];
  }

  /**
   * FUNCTIONS
   */

  private dateInputMask() {
    const dp = document.getElementById(this.id + "DatePickerTextField") as HTMLInputElement;
    dp.addEventListener('keypress', (e: KeyboardEvent)=>{
      
      /// don't show menu when user is typing date
      // makes validation hard to manage
      this.menu=false;
      if (e.key.toLowerCase()==="enter"){
        this.$refs.atatDatePicker.validate();
      }
     
      if(Number.isNaN(parseInt(e.key))) {
        e.preventDefault();
      }
      
      const len = dp.value.length;
      switch(len){
      case 2:
      case 5:
        dp.value += '/';
        break;
      case 10:
        e.preventDefault();
        break;
      default:
        break;
      }

      
    });
  };



  /**
   * @date (string)
   * returns formatted date as yyyy-MM-dd if date isValid
   */
  private reformatDate(d: string): string {
    let formattedDate = "";
    if (isValid(new Date(d))) {
      formattedDate = d.includes("-")
        ? format(new Date(d+'T00:00:00'), 'P')
        : formatISO(new Date(d), { representation: 'date' })
    }
    return formattedDate;
  }

  /**
   * toggle menus based on value of this.menu
   */
  private toggleMenu(): void {
    this.menu = !this.menu;
  }

  public get validateFormNow(): boolean {
    return AcquisitionPackage.getValidateNow;
  }

  @Watch('validateFormNow')
  public validateNowChange(): void {
    if(!this.$refs.atatDatePicker.validate()){
      this.setErrorMessage();
    }
  }

  /**
   * returns menutop based on if label
   */
  get getMenutop(): string {
    return this.label !== "" ? "80" : "40";
  }

  private async setErrorMessage(): Promise<void> {
    this.errorMessages = await this.$refs.atatDatePicker.errorBucket;
  }

  public async setDateFromValue(): Promise<void> {
    if (this.value && this.value.indexOf("-") > -1) {
      this.date = this.value;
    } else if (this.value && this.value.indexOf("/") > -1) {
      this.date = this.reformatDate(this.value);
    }
  }

  /**
   * LIFECYCLE HOOKS
   */
  private async mounted(): Promise<void> {
    await this.setDateFromValue();
    this.formatDateWatcher();
    this.dateInputMask();
    this.removeErrors();
  }

}
</script>