Vue.component('table-item', {
  props: ['data', 'item'],
  template: `<tr>
    <td class="tableItem">{{ data.id }}</td>
    <td class="tableItem">{{ data.type }}</td>
    <td class="tableItem"> {{ data.code }} </td>
    <td class="tableItem"> {{ data.name || 'unknown' }} </td>
    <td class="tableItem"> {{ data.createBy }}</td>
   
    </tr>`
})
const viewChain = new Vue({
  el: '#viewChain',
  data: {
    search: undefined,
    viewChain: [],
    itemList: []
  },
  mounted: async function () {
    this.viewChain = await apiService.get('/api/recentActivity');
    this.itemList = this.viewChain
    console.log(this.viewChain)
    // .sort(function (a, b) {
    //   return new Date(b.timestamp) - new Date(a.timestamp);
    // });
    console.log(this.itemList);
  },
  methods: {
    searchItems: function (search) {
      if (search) {
        this.itemList = this.viewChain.filter(item => {
          return item.code == search || item.name == search
        }).sort(function (a, b) {
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        return;
      }
      this.itemList = this.viewChain.sort(function (a, b) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });;

    },
  }


})