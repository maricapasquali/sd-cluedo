<script lang="ts" src="./script.ts"/>

<template>
  <div class="accordion" role="tablist">
    <BCard no-body class="mb-1">
      <b-card-header header-tag="header" class="p-1" role="tab">
        <b-button v-b-toggle.notes-rooms variant="primary" class="w-100">Rooms</b-button>
      </b-card-header>
      <BCollapse id="notes-rooms" visible accordion="my-accordion" role="tabpanel">
        <BCardBody>
          <BListGroup>
            <BListGroupItem v-for="item in roomsNotes" :class="{disabled: isInMyHand(item) || item?.confutation}">
              <BContainer>
                <BRow>
                  <BCol class="col-12 col-sm-5"><p><b>{{item.name}}</b></p>
                    <p v-if="isInMyHand(item)"> (In my hand) </p>
                    <p v-if="item.confutation"> (Confutated) </p>
                  </BCol>
                  <BCol class="col-12 col-sm-7">
                    <BFormSelect
                      v-model="item.suspectState"
                      :options="suspectStates"
                      :disabled="disabled"
                      @input="onSelectedSuspectedState(item, $event)"
                      stacked
                    />
                  </BCol>
                </BRow>
              </BContainer>
            </BListGroupItem>
          </BListGroup>
        </BCardBody>
      </BCollapse>
    </BCard>

    <BCard no-body class="mb-1">
      <b-card-header header-tag="header" class="p-1" role="tab">
        <b-button v-b-toggle.notes-weapons variant="primary" class="w-100">Weapons</b-button>
      </b-card-header>
      <BCollapse id="notes-weapons" visible accordion="my-accordion" role="tabpanel">
        <BCardBody>
          <BListGroup>
            <BListGroupItem v-for="item in weaponsNotes" :class="{disabled: isInMyHand(item) || item?.confutation}">
              <BContainer>
                <BRow>
                  <BCol class="col-12 col-sm-5"><p><b>{{item.name}}</b></p>
                    <p v-if="isInMyHand(item)"> (In my hand) </p>
                    <p v-if="item.confutation"> (Confutated) </p>
                  </BCol>
                  <BCol class="col-12 col-sm-7">
                    <BFormSelect
                      v-model="item.suspectState"
                      :options="suspectStates"
                      :disabled="disabled"
                      @input="onSelectedSuspectedState(item, $event)"
                      stacked
                    />
                  </BCol>
                </BRow>
              </BContainer>
            </BListGroupItem>
          </BListGroup>
        </BCardBody>
      </BCollapse>
    </BCard>

    <BCard no-body class="mb-1">
      <b-card-header header-tag="header" class="p-1" role="tab">
        <b-button v-b-toggle.notes-characters variant="primary" class="w-100">Characters</b-button>
      </b-card-header>
      <BCollapse id="notes-characters" visible accordion="my-accordion" role="tabpanel">
        <BCardBody>
          <BListGroup>
            <BListGroupItem v-for="item in charactersNotes" :class="{disabled: isInMyHand(item) || item?.confutation}">
              <BContainer>
                <BRow>
                  <BCol class="col-12 col-sm-5"><p><b>{{item.name}}</b></p>
                    <p v-if="isInMyHand(item)"> (In my hand) </p>
                    <p v-if="item.confutation"> (Confutated) </p>
                  </BCol>
                  <BCol class="col-12 col-sm-7">
                    <BFormSelect
                      v-model="item.suspectState"
                      :options="suspectStates"
                      :disabled="disabled"
                      @input="onSelectedSuspectedState(item, $event)"
                      stacked
                    />
                  </BCol>
                </BRow>
              </BContainer>
            </BListGroupItem>
          </BListGroup>
        </BCardBody>
      </BCollapse>
    </BCard>
  </div>
</template>

<style lang="scss" scoped src="./style.scss"/>
