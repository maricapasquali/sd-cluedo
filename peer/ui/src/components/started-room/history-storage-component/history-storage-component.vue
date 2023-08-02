<script lang="ts" src="./script.ts"/>

<template>
  <div class="my-toaster">
    <BAlert v-for="toast in toasts"
            :key="toast.body"
            v-model="toast.dismissCountDown"
            :variant="bgColor(toast.body.action)"
            dismissible>
      <BListGroupItem>
        <gamer-description id="history" :gamer="gamer(toast.body.gamer)" />
        <h5>{{toast.body.action.replace('_', ' ').toUpperCase()}}</h5>
        <p v-html="parseMessage(toast.body.action, toast.body.message)"></p>
        <p>{{dateString(toast.body.timestamp)}}</p>
      </BListGroupItem>
    </BAlert>
  </div>

  <BListGroup class="scroll">
    <BListGroupItem v-for="item in historyStore" :variant="bgColor(item.action)">
      <gamer-description id="history" :gamer="gamer(item.gamer)" />
      <h5>{{item.action.replace('_', ' ').toUpperCase()}}</h5>
      <p v-html="parseMessage(item.action, item.message)"></p>
      <p>{{dateString(item.timestamp)}}</p>
    </BListGroupItem>
  </BListGroup>
</template>

<style scoped lang="scss" src="./style.scss" />
