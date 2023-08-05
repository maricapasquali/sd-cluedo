<script lang="ts" src="./script.ts"/>

<template>
  <BOverlay :show="loading" rounded="md">
    <BContainer fluid v-if="!loading" >
      <BRow class="col-12">
        <BCol class="col-12 col-md-4 col-lg-3 my-2">
          <BContainer>
            <BRow class="my-1">
              <!-- List of Gamers -->
              <BCard no-body class="p-1 pt-0">
                <template #header>
                  <h4>Gamers</h4>
                </template>
                <BListGroup>
                  <BListGroupItem v-for="gamer in reactiveGame.gamers" :class="isSilentGamer(gamer)? 'disabled': ''"
                  ><gamer-description id="list-gamer" :gamer="gamer" online></gamer-description
                  ></BListGroupItem>
                </BListGroup>
              </BCard>
            </BRow>
            <BRow class="my-1">
              <!-- List of operations and round gamer -->
              <BCard no-body class="p-1 pt-0">
                <template #header>
                  <h4>Operations</h4>
                </template>
                <operations-game-component :game="reactiveGame"/>
              </BCard>
            </BRow>
            <BRow class="my-1">
              <BCard no-body class="p-1 pt-0">
                <template #header>
                  <h4>History</h4>
                </template>
                <!-- List of action performed by gamers -->
                <history-storage-component :game="reactiveGame" />
              </BCard>
            </BRow>
          </BContainer>
        </BCol>
        <BCol class="col-12 col-md-8 col-lg-9 my-2" >
          <BContainer fluid>
            <BRow>
              <BCol class="col-12 col-lg-6 mb-2">
                <game-board :game="reactiveGame" />
              </BCol>
              <BCol class="col-12 col-lg-6">
                <BCard no-body class="p-1 pt-0">
                  <template #header>
                    <h4>Notes</h4>
                  </template>
                  <structured-notes-component
                    :my-assumptions="iGamer.assumptions || []"
                    :my-cards="iGamer.cards || []"
                    :disabled="amISilent"
                    :options="gameBoardElements"
                    v-model="iGamer.notes.structuredNotes"
                    @input="onWriteNotes"/>
                  <BFormTextarea
                    rows="10"
                    class="mb-2"
                    :model-value="iGamer.notes.text"
                    @input="onWriteNotes"
                    :disabled="amISilent"
                  />
                </BCard>
              </BCol>
            </BRow>
          </BContainer>
        </BCol>
      </BRow>
    </BContainer>
  </BOverlay>
</template>

<style lang="scss" scoped src="./style.scss" />
