<template>
  <div class="text-center">
    <v-menu
      :close-on-content-click="false"
      left
      open-on-hover
      offset-x
      v-if="member"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          plain
          text
          v-bind="attrs"
          v-on="on"
          class="font-size-14 _profile-card__name-button"
        >
          <span v-if="member.firstName">
            {{member.firstName}} {{ member.lastName}}{{ getMemberTitle }}
          </span>
          <span v-else>
            {{member.email}}
          </span>
        </v-btn>
      </template>

      <ATATProfileCard :person="member" />

    </v-menu>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { User } from "../../../../../types/Global";

import ATATSVGIcon from "@/components/icons/ATATSVGIcon.vue";
import ATATProfileCard from "@/components/ATATProfileCard.vue";

@Component({
  components: {
    ATATSVGIcon,
    ATATProfileCard,
  }
})

export default class MemberCard extends Vue {
  @Prop({required: true}) private member!: User;

  public get getMemberTitle(): string {
    return this.member.title ? ", " + this.member.title : "";
  }


}
</script>
