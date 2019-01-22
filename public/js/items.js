Vue.component('table-item', {
  props: ['data', 'order'],
  template: `<tr>
    
    <td class="tableItem">{{ data.code }}</td>
    <td class="tableItem"> {{data.name }} </td>
    <td class="tableItem"> {{ data.item }} </td>
    <td class="tableItem"> <button @click="order(data)" > Order </button> </td>
    </tr>`
})
const items = new Vue({
  el: '#items',
  data: {
    search: undefined,

    allItems: [],
    itemList: [],
  },
  mounted: async function () {
    this.allItems = await apiService.get('/api/items');
    this.itemList = this.allItems;

  },
  methods: {
    searchItems: function (search) {
      this.itemList = this.allItems.filter(item => {
        return item.code == search || item.name == search
      })
    },
    orderItem: async function (data) {
      const response = await apiService.post('/api/order', data);
      console.log(response);
    }
  }


})