<template>
  <header>
    <h1>Cluedo Online</h1>
  </header>
  <router-view />
</template>

<script setup lang="ts">
</script>

<style lang="scss">
$app-background-color:midnightblue;

html {
  background-color: $app-background-color;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
  background-color: $app-background-color;
}

header, nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>

