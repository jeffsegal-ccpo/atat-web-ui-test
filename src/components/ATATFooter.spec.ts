import Vue from "vue";
import Vuetify from "vuetify";
import { createLocalVue, mount } from "@vue/test-utils";
import ATATFooter from "@/components/ATATFooter.vue";
Vue.use(Vuetify);

describe("Testing ATATTextField Component", () => {
  const localVue = createLocalVue();
  let vuetify: any;
  let wrapper: any;

  beforeEach(() => {
    vuetify = new Vuetify();
    wrapper = mount(ATATFooter, {
      localVue,
      vuetify,
    });
  });
  it("renders successfully", async () => {
    const footer = wrapper.findComponent(ATATFooter)
    expect(footer.exists()).toBe(true);
    expect(footer.classes()).toContain("v-footer")
    expect(footer.classes()).toContain("atat-page-footer")
  });

  it("should have three links", async () => {
    const links = await wrapper.findAll("._text-link")
    expect(links.length).toEqual(3)
    expect(links.at(0).text()).toEqual("Security Notice")
    expect(links.at(1).text()).toEqual("Privacy")
    expect(links.at(2).text()).toEqual("Accessibility")
  })
});
