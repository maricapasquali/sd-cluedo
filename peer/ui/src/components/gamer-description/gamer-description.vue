<script lang="ts" src="./script.ts" />

<template>
  <div class="my-2" >
    <BTooltip v-if="onlyIcon" :target="avatarId" triggers="hover">
      {{completeName}}
    </BTooltip>
    <BAvatar :id="avatarId" class="align-content-center p-0" :size="size || 'md'" rounded="lg" :badge="me" badge-variant="success" :variant="variant" icon="person-circle" :alt="gamer.characterToken">
      <font-awesome-icon :icon="isSilentGamer ? 'user-slash':'user'" :size="size || '1x'" />
    </BAvatar>
    <span class="mx-2" v-if="!onlyIcon">
      <b>{{(gamer as Gamer).characterToken?.toUpperCase()}}</b>
      <span v-if="!noUsername"> ({{(gamer as Gamer).username}})</span>
    </span>
  </div>
</template>

<style lang="scss" scoped src="./style.scss" />
