<script lang="ts" src="./script.ts"/>

<template>
  <BCol :id="room.name" class="room" v-for="room in rooms" >
    <BTooltip :target="room.name" triggers="hover">
      {{room.name}}
    </BTooltip>
    <span class="position-absolute"><b> {{room.name?.toUpperCase()}}</b></span>
    <div>
      <slot name="characters" :room="room"></slot>
      <slot name="weapons" :room="room"></slot>
    </div>
    <div v-if="room.secretPassage">
      <secret-passage :id="'secret-passage-of-'+room.name"
                      aria-label="secret-passage"
                      :class="secretRoomClasses(room)"
                      :bg-color="colorsRoom[room.name]"
                      :alt="room.secretPassage" />
      <BTooltip :target="'secret-passage-of-'+room.name" triggers="hover">
        Secret Passage to {{room.secretPassage.toUpperCase()}}
      </BTooltip>
    </div>
  </BCol>
</template>

<style scoped lang="scss" src="./style.scss"/>
