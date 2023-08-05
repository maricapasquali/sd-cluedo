<script lang="ts" src="./script.ts" />

<template>
  <BButton v-if="game" variant="primary" @click="clickEnterInGame">Enter in game</BButton>
  <BButton v-else @click="modal = !modal" variant="success">Create new game</BButton>
  <BModal v-model="modal" hide-footer :title="game ? 'Enter in game '+(game.identifier) :'Create new game'">
    <b-overlay :show="loading" rounded="md">
      <BForm>
        <BAlert ref="error-alert" v-model="alert" variant="danger" title="Error" dismissible>
          <p><b>{{error.status}} - {{error.statusText}}</b></p>
          <p><b>Message</b> {{error.data?.message}} </p>
          <p v-if="error.data?.cause"><b>Cause</b> <br/>{{error.data?.cause}}</p>
        </BAlert>
        <BFormGroup label="Username" label-for="gamer-username" >
          <BFormInput id="gamer-username" v-model="gamer.username" placeholder="Enter username"></BFormInput>
        </BFormGroup>
        <div class="my-2">
          <label variant="primary">Choose character token</label>
        </div>
        <BFormRadioGroup id="radio-character-token" v-model="gamer.characterToken" name="radio-sub-component">
          <BFormRadio v-for="character in cluedoCharacters" :value="character" style="cursor: pointer">
            <gamer-description id="choose-gamer-token" :gamer="{characterToken: character} as Gamer" style="cursor: pointer" />
          </BFormRadio>
        </BFormRadioGroup>
      </BForm>
      <BContainer class="d-flex justify-content-end" v-if="gamer.username?.length > 0 && gamer.characterToken?.length > 0">
        <b-button v-if="game" variant="primary" @click="enterInGame">Enter</b-button>
        <b-button v-else variant="success" @click="postGame">Create</b-button>
      </BContainer>
    </b-overlay>
  </BModal >
</template>

