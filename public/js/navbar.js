Vue.component('nav-item', {
  props: ['nav'],
  template: `<a class="navbar-item" v-bind:href="nav.link">{{ nav.text }}</a>`
})

const navbar = new Vue({
  el: '#navbar',
  data: {
    navbarList: [{
        text: 'Register',
        link: '/register'
      },
      {
        text: 'Login',
        link: '/login'
      }
    ],

  },
  mounted: async function () {
    this.navbarList = await apiService.get('/api/links')
  }



})