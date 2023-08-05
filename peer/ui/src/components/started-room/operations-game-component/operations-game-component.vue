<script lang="ts" src="./script.ts"/>

<template>
  <BModal :model-value="!makeAssumptionModal.show &&!endGameModal.show && !makeAccusationModal.show && !confutationAssumptionModal.show && denialOperationError.show"
          title="Error" centered hide-footer hide-header body-class="p-0">
    <OperationErrorAlert class="mb-0"
                         v-model="denialOperationError.show"
                         :opMessageError="denialOperationError"
    />
  </BModal>

  <BModal centered v-model="makeAssumptionModal.show" hide-footer>
    <template #title>
      <h4 class="m-0 p-2 bg-primary rounded-3 text-white">
        {{
          Action.MAKE_ASSUMPTION.replace('_', ' ').toUpperCase()
        }}
      </h4>
    </template>
    <OperationErrorAlert
      v-model="denialOperationError.show"
      :opMessageError="denialOperationError"
    />
    <BContainer v-if="!makeAssumptionModal.message">
      <BRow>
        <BCol class="my-2 col-12 col-sm-4">
          <label for="assumption-character"> Character </label>
          <BFormSelect
            id="assumption-character"
            v-model="makeAssumptionModal.assumption.character"
          >
            <template #first>
              <BFormSelectOption disabled :value="null"
                >Please select a character</BFormSelectOption
              >
            </template>
            <BFormSelectOption
              v-for="character in characters"
              :value="character"
              >{{ character }}</BFormSelectOption
            >
          </BFormSelect>
        </BCol>
        <BCol class="my-2 col-12 col-sm-4">
          <label for="assumption-weapon"> Weapon </label>
          <BFormSelect
            id="assumption-weapon"
            v-model="makeAssumptionModal.assumption.weapon"
          >
            <template #first>
              <BFormSelectOption disabled :value="null"
                >Please select a weapon</BFormSelectOption
              >
            </template>

            <BFormSelectOption v-for="weapon in weapons" :value="weapon">{{
              weapon
            }}</BFormSelectOption>
          </BFormSelect>
        </BCol>
        <BCol class="my-2 col-12 col-sm-4">
          <label for="assumption-room"> Room </label>
          <div id="assumption-room" class="form-control">
            {{ myPositionInHouse }}
          </div>
        </BCol>
      </BRow>
      <BRow>
        <BCol class="d-flex justify-content-end">
          <BButton variant="primary" @click="makeAssumption">Send</BButton>
        </BCol>
      </BRow>
    </BContainer>
    <BContainer v-else>
      <div
        class="my-5"
        v-if="Object.keys(makeAssumptionModal.confutation).length == 0"
      >
        <BRow>
          <BCol class="d-flex justify-content-center">
            <BSpinner label="waiting confutation" />
          </BCol>
        </BRow>
        <BRow>
          <BCol class="d-flex justify-content-center">
            <label>Waiting confutation</label>
          </BCol>
        </BRow>
      </div>
      <div v-else>
        <BContainer>
          <BRow>
            <BListGroup>
              <BListGroupItem
                v-for="[gamerId, card] in Object.entries(
                  makeAssumptionModal.confutation
                )"
              >
                <b>{{ username(gamerId) }}</b> show me
                <b>{{ card && card.length > 0 ? card : 'none card' }}</b>
              </BListGroupItem>
            </BListGroup>
          </BRow>
<!--          <BRow v-if="haveReceivedAnyConfutation">-->
<!--            <BCol class="mt-3 d-flex justify-content-end"> <BButton variant="outline-primary" @click="clickOkOnReceiveConfutation">Ok</BButton> </BCol>-->
<!--          </BRow>-->
        </BContainer>
      </div>
    </BContainer>
  </BModal>

  <BModal
    centered
    v-model="confutationAssumptionModal.show"
    hide-footer
    no-close-on-esc
    no-close-on-backdrop
    hide-header-close
  >
    <template #title>
      <h4 class="m-0 p-2 bg-primary rounded-3 text-white">
        {{
          Action.CONFUTATION_ASSUMPTION.replace(
            '_',
            ' '
          ).toUpperCase()
        }}
      </h4>
    </template>
    <OperationErrorAlert
      v-model="denialOperationError.show"
      :opMessageError="denialOperationError"
    />
    <BContainer>
      <BRow>
        <BCol class="col-12">
          <p>
            <b>{{
              username(confutationAssumptionModal.arrivalAssumption.gamer)
            }}</b>
            assumed that
            <b>{{
              confutationAssumptionModal.arrivalAssumption.suggestion.character
            }}</b>
            has killed using
            <b>{{
              confutationAssumptionModal.arrivalAssumption.suggestion.weapon
            }}</b>
            in
            <b>
              {{
                confutationAssumptionModal.arrivalAssumption.suggestion.room
              }}</b
            >
          </p>
        </BCol>
        <BCol class="col-12" v-if="myCardOnAssumption.length > 0">
          <label for="confutation-assumption">Confute assumption</label>
          <BFormSelect
            id="confutation-assumption"
            v-model="confutationAssumptionModal.confute"
          >
            <template #first>
              <BFormSelectOption value="" />
            </template>
            <BFormSelectOption
              v-for="card in myCardOnAssumption"
              :value="card"
              >{{ card }}</BFormSelectOption
            >
          </BFormSelect>
        </BCol>
      </BRow>
      <BRow>
        <BCol class="mt-3 d-flex justify-content-end">
          <BButton variant="primary" @click="confutationGamerAssumption">{{
            myCardOnAssumption.length > 0 &&
            confutationAssumptionModal.confute.length > 0
              ? 'Show'
              : 'No Card'
          }}</BButton>
        </BCol>
      </BRow>
    </BContainer>
  </BModal>

  <BModal
    centered
    v-model="makeAccusationModal.show"
    hide-footer
    :no-close-on-esc="makeAccusationModal.win != null"
    :no-close-on-backdrop="makeAccusationModal.win != null"
    :hide-header-close="makeAccusationModal.win != null"
  >
    <template #title>
      <h4
        :class="
          'm-0 p-2 rounded-3 text-white ' +
          (makeAccusationModal.win == null
            ? 'bg-primary'
            : makeAccusationModal.win
            ? 'bg-success'
            : 'bg-danger')
        "
      >
        {{
          Action.MAKE_ACCUSATION.replace('_', ' ').toUpperCase()
        }}
        {{
          makeAccusationModal.win == null
            ? ''
            : makeAccusationModal.win == true
            ? ': WIN'
            : ': LOSE'
        }}
      </h4>
    </template>
    <OperationErrorAlert
      v-model="denialOperationError.show"
      :opMessageError="denialOperationError"
    />

    <BContainer v-if="Object.values(makeAccusationModal.solution).length === 0">
      <BRow>
        <BCol class="my-2 col-12 col-sm-4">
          <label for="assumption-character"> Character </label>
          <BFormSelect
            id="assumption-character"
            v-model="makeAccusationModal.accusation.character"
          >
            <template #first>
              <BFormSelectOption disabled :value="null"
                >Please select a character</BFormSelectOption
              >
            </template>
            <BFormSelectOption
              v-for="character in characters"
              :value="character"
              >{{ character }}</BFormSelectOption
            >
          </BFormSelect>
        </BCol>
        <BCol class="my-2 col-12 col-sm-4">
          <label for="assumption-weapon"> Weapon </label>
          <BFormSelect
            id="assumption-weapon"
            v-model="makeAccusationModal.accusation.weapon"
          >
            <template #first>
              <BFormSelectOption disabled :value="null"
                >Please select a weapon</BFormSelectOption
              >
            </template>

            <BFormSelectOption v-for="weapon in weapons" :value="weapon">{{
              weapon
            }}</BFormSelectOption>
          </BFormSelect>
        </BCol>
        <BCol class="my-2 col-12 col-sm-4">
          <label for="assumption-room"> Room </label>
          <BFormSelect
            id="assumption-room"
            v-model="makeAccusationModal.accusation.room"
          >
            <template #first>
              <BFormSelectOption disabled :value="null"
                >Please select a room</BFormSelectOption
              >
            </template>

            <BFormSelectOption v-for="room in rooms" :value="room">{{
              room
            }}</BFormSelectOption>
          </BFormSelect>
        </BCol>
      </BRow>
      <BRow>
        <BCol class="d-flex justify-content-end">
          <BButton variant="primary" @click="makeAccusation">Send</BButton>
        </BCol>
      </BRow>
    </BContainer>
    <BContainer v-else-if="makeAccusationModal.win">
      <BRow>
        <p>
          {{
            makeAccusationModal.gamerId
              ? username(makeAccusationModal.gamerId)
              : 'I'
          }}
          assumed that <b>{{ makeAccusationModal.accusation.character }}</b> has
          killed using <b>{{ makeAccusationModal.accusation.weapon }}</b> in
          <b> {{ makeAccusationModal.accusation.room }}</b>
        </p>
      </BRow>
      <BRow>
        <BCol class="mt-3 d-flex justify-content-end">
          <BButton variant="primary" @click="finishedGameSoGoHomePage"
            >Ok</BButton
          >
        </BCol>
      </BRow>
      <BRow></BRow>
    </BContainer>
    <BContainer v-else>
      <BRow>
        <p>
          I assumed that
          <b>{{ makeAccusationModal.accusation.character }}</b> has killed using
          <b>{{ makeAccusationModal.accusation.weapon }}</b> in
          <b> {{ makeAccusationModal.accusation.room }}</b>
        </p>
        <div>
          Solution:
          <ul>
            <li>
              Character: <b>{{ makeAccusationModal.solution.character }}</b>
            </li>
            <li>
              Weapon: <b>{{ makeAccusationModal.solution.weapon }}</b>
            </li>
            <li>
              Room: <b>{{ makeAccusationModal.solution.room }}</b>
            </li>
          </ul>
        </div>
      </BRow>
      <BRow>
        <BCol class="mt-3 d-flex justify-content-between">
          <BButton variant="primary" @click="leaveGame">Leave</BButton>
          <BButton variant="outline-primary" @click="stayInGame">Stay</BButton>
        </BCol>
      </BRow>
    </BContainer>
  </BModal>

  <BModal
    centered
    v-model="endGameModal.show"
    hide-footer
    no-close-on-backdrop
    no-close-on-esc
    hide-header-close
  >
    <template #title>
      <h4 class="m-0 p-2 bg-warning rounded-3 text-white">End Game</h4>
    </template>
    <OperationErrorAlert
      v-model="denialOperationError.show"
      :opMessageError="denialOperationError"
    />
    <BContainer>
      <BRow>
        <BCol class="col-12"><p>Nobody solved the murder.</p></BCol>
        <BCol class="col-12">
          Solution:
          <ul>
            <li>
              Character: <b>{{ endGameModal.solution.character }}</b>
            </li>
            <li>
              Weapon: <b>{{ endGameModal.solution.weapon }}</b>
            </li>
            <li>
              Room: <b>{{ endGameModal.solution.room }}</b>
            </li>
          </ul>
        </BCol>
      </BRow>
      <BRow>
        <BCol>
          <BCol class="mt-3 d-flex justify-content-end">
            <BButton variant="outline-primary" @click="finishedGameSoGoHomePage"
              >Ok</BButton
            >
          </BCol>
        </BCol>
      </BRow>
    </BContainer>
  </BModal>

  <BButtonGroup v-if="amIInRound" vertical>
    <BButton
      variant="outline-primary"
      class="btn-action"
      @click="rollDie"
      v-if="!makeAssumptionModal.message"
      >Roll die</BButton
    >
    <BButton
      variant="outline-primary"
      class="btn-action"
      @click="onClickMakeAssumption"
      v-if="!inLobby"
      >Make assumption</BButton
    >
    <BButton
      variant="outline-primary"
      class="btn-action"
      @click="onClickMakeAccusation"
      v-if="!inLobby && !makeAssumptionModal.message"
      >Make accusation</BButton
    >
    <BButton
      variant="outline-primary"
      class="btn-action"
      @click="useSecretPassage"
      v-if="inRoomWithSecretPassage && !makeAssumptionModal.message"
      >Use secret passage</BButton
    >
  </BButtonGroup>
  <BContainer v-else class="my-3">
    <BRow>
      <BCol class="col-12"><h5>Round of</h5></BCol>
      <BCol class="col-12"
        ><gamer-description
          id="gamer-in-round"
          :gamer="inRoundGamer"
        ></gamer-description
      ></BCol>
    </BRow>
    <BRow class="my-3">
      <BCol class="col-12"><h5>Next one</h5></BCol>
      <BCol class="col-12"
        ><gamer-description
          id="next-gamer"
          :gamer="nextGamer"
        ></gamer-description
      ></BCol>
    </BRow>
  </BContainer>
</template>
