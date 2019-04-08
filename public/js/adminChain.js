Vue.component('table-item', {
  props: ['data', 'expand', 'id', 'reduce'],
  template: `<tbody>
    <tr>
      <td @click="expand(data.id)"  class="tableItem pointer">{{ data.id }}</td>    
      <td @click="expand(data.id)" class="tableItem pointer"> {{ data.code }} </td>
      <td @click="expand(data.id)" class="tableItem pointer"> {{ data.name || 'unknown' }} </td>
      <td @click="expand(data.id)" class="tableItem pointer"> {{ data.createBy }}</td>
    </tr>
    <tr v-for="red in reduce[data.id ].types" class="expandRow">
      <td :class="{ 'ta' : id != data.id }" colspan="2"> {{ red.time }} </td>
      <td :class="{ 'ta' : id != data.id }" colspan="2"> {{ red.type }} </td>
    </tr>
    </tbody>
    `
})
const viewChain = new Vue({
  el: '#viewChain',
  data: {
    search: undefined,
    id: undefined,
    viewChain: [],
    itemList: [],
    reduced: {}
  },
  mounted: async function () {
    const data = await apiService.get('/api/block');
    data.forEach(x => {
      if (this.reduced[x.id] == undefined) {
        this.reduced[x.id] = x
        this.reduced[x.id].types = [{
          time: x.timestamp,
          type: x.type
        }];
      } else
        this.reduced[x.id].types.push({
          time: x.timestamp,
          type: x.type
        })
      return x
    })
    this.viewChain = Object.values(this.reduced)
    console.log(this.reduced)
    this.itemList = this.viewChain.sort(function (a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    console.log(this.itemList);
  },
  methods: {
    searchItems: function (search) {
      if (search) {
        this.itemList = this.viewChain.filter(item => {
          return item.code == search || item.name == search
        })
        // .sort(function (a, b) {
        //   return new Date(b.timestamp) - new Date(a.timestamp);
        // });
        return;
      }
      this.itemList = this.viewChain.sort(function (a, b) {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
    },
    expandItem: function (id) {
      (this.id == id) ? this.id = undefined: this.id = id
    }

  }


})