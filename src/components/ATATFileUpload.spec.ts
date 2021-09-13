import Vue from "vue";
import Vuetify from "vuetify";
import Vuex from "vuex";
import { createLocalVue, mount } from "@vue/test-utils";
import fileUpload from "@/components/ATATFileUpload.vue";
import axios from "axios";
import VueAxios from "vue-axios";

Vue.use(Vuetify);
Vue.use(VueAxios, axios);

describe("Testing ATATFileUpload Component", () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);
  // localVue.use(VueAxios, axios);
  let vuetify: any;
  let wrapper: any;
  let store: any;
  const actions: any = {
    updateWizardStep: jest.fn(),
  };

  beforeEach(() => {
    vuetify = new Vuetify();
    store = new Vuex.Store({
      actions,
    });
    wrapper = mount(fileUpload, {
      store,
      localVue,
      vuetify,
      stubs: [
        "v-virtual-scroll",
        "v-flex",
        "v-sheet",
        "v-card",
        "v-card-text",
        "v-row",
        "v-icon",
        "v-btn",
        "v-list-item",
        "v-list-item-content",
        "v-list-item-title",
        "fileInput",
        "progress-bar",
      ],
    });

    jest.restoreAllMocks();
  });

  it("renders successfully", async () => {
    expect(wrapper.exists()).toBe(true);
  });

  it("computed property -> hasErrors", async () => {
    await wrapper.setData({
      errorMessages: [],
    });
    expect(wrapper.vm.hasErrors).toBe(false);

    await wrapper.setData({
      errorMessages: ["Invalid Data"],
    });
    expect(wrapper.vm.hasErrors).toBe(true);
  });

  it("computed property -> isFileUploaded", async () => {
    await wrapper.setData({
      uploadedFile: [],
    });
    expect(wrapper.vm.isFileUploaded).toBe(false);

    await wrapper.setData({
      uploadedFile: [{ name: "validpdf.pdf" }],
    });
    expect(wrapper.vm.isFileUploaded).toBe(true);
  });

  it("computed property -> showBorderState", async () => {
    await wrapper.setData({
      isFileUploadedSucessfully: true,
    });
    expect(wrapper.vm.showBorderState).toBe("success-file-upload-border");
    await wrapper.setData({
      isFileUploadedSucessfully: false,
      isProgressBarVisible: true,
    });
    expect(wrapper.vm.showBorderState).toBe("primary-file-upload-border");
  });

  it("watch -> errorMessageFromParent", async () => {
    await wrapper.setData({
      errorMessages: ["error message"],
    });
    await wrapper.setProps({
      errorMessageFromParent: "New Error Message",
    });
    expect(wrapper.vm.errorMessages.length).toBe(2);
  });

  it("method > openFileDialog ", async () => {
    const openFileDialogButton = await wrapper.find("#open-file-dialog");
    openFileDialogButton.trigger("click");

    expect(wrapper.find({ ref: "fileInput" }).exists()).toBe(true);
  });

  it("addUploadedFile() - valid mocked file", async () => {
    await wrapper.setProps({
      maxFileSize: 20,
    });
    const fileInput = wrapper.find("#file-input-button");
    const invalidFile = new File(["%PDF-1.7"], "pdfFile.pdf", {
      lastModified: 1623265616555,
      type: "application/pdf",
    });
    fileInput.files = [invalidFile];
    const event = fileInput.trigger("change");
    await wrapper.vm.addUploadedFile(event, fileInput.files);

    expect(await wrapper.vm.$data.errorMessages.length).toBe(0);
  });
  it("addUploadedFile() - invalid mocked file", async () => {
    await wrapper.setProps({
      maxFileSize: 20,
    });
    const fileInput = wrapper.find("#file-input-button");

    const invalidFile = new File(["%PDF-1.7"], "", {
      lastModified: 1623265616555,
      type: "application/pdf",
    });

    console.log(invalidFile.size);
    fileInput.files = [invalidFile];
    const event = fileInput.trigger("change");
    await wrapper.vm.addUploadedFile(event, fileInput.files);

    expect(await wrapper.vm.$data.errorMessages.length).toBe(1);
  });

  it("validateFile() >> file.type !== 'application/pdf'", () => {
    const invalidFile = new File(["%PDF-1.7"], "File.pdf", {
      lastModified: 1623265616555,
      type: "application/text",
    });

    wrapper.vm.validateFile(invalidFile);
    expect(wrapper.vm.$data.errorMessages).toContain("File is not a valid PDF");
  });

  it("validateFile() >> file.name === ''", () => {
    const invalidFile = new File(["%PDF-1.7"], "", {
      lastModified: 1623265616555,
      type: "application/pdf",
    });

    wrapper.vm.validateFile(invalidFile);
    expect(wrapper.vm.$data.errorMessages).toContain(
      "Please upload your Task Order Document"
    );
  });

  it("validateFile() >> validate filesize", async () => {
    await wrapper.setProps({
      maxFileSize: 20,
    });

    const eventWithFileTooLarge = {
      target: {
        files: [
          {
            name: "pdfFile.pdf",
            lastModified: 1623265616555,
            lastModifiedDate: new Date(),
            size: 31000000,
            type: "application/pdf",
          },
        ],
      },
    };

    const fileReaderSpyFileTooLarge = jest
      .spyOn(FileReader.prototype, "readAsText")
      .mockImplementation(() => null);

    const addUploadedFileSpyFileTooLarge = jest.spyOn(
      wrapper.vm,
      "addUploadedFile"
    );
    // https://zaengle.com/blog/mocking-file-upload-in-vue-with-jest
    const fileInputInvalidFile = wrapper.find("#file-input-button");
    fileInputInvalidFile.trigger("change");
    wrapper.vm.addUploadedFile(
      eventWithFileTooLarge,
      eventWithFileTooLarge.target.files
    );
    expect(await fileReaderSpyFileTooLarge).toHaveBeenCalledWith(
      eventWithFileTooLarge.target.files[0]
    );
    expect(await addUploadedFileSpyFileTooLarge).toHaveBeenCalledWith(
      eventWithFileTooLarge,
      eventWithFileTooLarge.target.files
    );
    console.log(await wrapper.vm.$data.errorMessages);

    const maxFileSize = wrapper.vm.$props.maxFileSize;
    expect(await wrapper.vm.$data.errorMessages).toContain(
      "File size cannot exceed " + maxFileSize + "MB"
    );
  });

  it("validateFile() >> isPDFInvalid", async () => {
    const invalidFile = new File(["%PDF-1.jnkFile"], "pdffile.pdf", {
      lastModified: 1623265616555,
      type: "application/pdf",
    });

    await wrapper.vm.validateFile(invalidFile);
    expect(await wrapper.vm.$data.errorMessages).toContain(
      "File is not a valid PDF"
    );
  });


  // it("drag and drop addUploadedFile() - valid mocked file", async () => {

  //   const fileInput = wrapper.find("#file-input-button");
  //   const dt = () => new DataTransfer() || new ClipboardEvent("").clipboardData;
  //   const _dt = dt();
  //   const invalidFile = new File(["%PDF-1.7"], "", {
  //     lastModified: 1623265616555,
  //     type: "application/pdf",
  //   });
  //   _dt.items.add(invalidFile);
  //   fileInput.files = _dt.files;
  //   fileInput.trigger("change");

  //   // await wrapper.vm.addUploadedFile(invalidFile);
  //   expect(await wrapper.vm.$data.errorMessages.length).toBe(0);
  // });
});
