<script lang="ts">
import { defineComponent, PropType } from "vue";
import { MessageError } from "../../../../../../../libs/utils/rest-api/responses";
import { QueryParameters } from "../../../../../../src/routes/parameters";
import Action = QueryParameters.Action;

type OpMessageError = {action: Action | '', error: MessageError & {codeText?: string}}
export default defineComponent({
  name: "operation-error-alert",
  props: {
    value: Boolean,
    opMessageError: Object as PropType<OpMessageError>
  }
});
</script>

<template>
  <BAlert dismissible :model-value="value" variant="danger" title="Error">
    <h4>{{opMessageError.error.code}} {{ opMessageError.error.codeText }}</h4>
    <p><b>Message</b>: {{opMessageError.error.message}}</p>
    <p><b>Cause</b>: {{opMessageError.error.cause}}</p>
  </BAlert>
</template>

<style scoped>

</style>
