<script lang="ts" src="./script.ts"/>

<template>
  <BCol :id="lobby.name" class="lobby">
    <BTooltip :target="lobby.name" triggers="hover">
      {{lobby.name}}
    </BTooltip>
    <span class="position-absolute"><b>{{lobby.name?.toUpperCase()}}</b></span>
    <div>
      <slot name="characters" :lobby="lobby"></slot>
    </div>
  </BCol>
</template>

<style lang="scss" scoped src="./style.scss" />
