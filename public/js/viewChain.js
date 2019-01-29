Vue.component('table-item', {
  props: ['data', 'item', 'expand', 'id', 'reduce'],
  template: `<tbody>
    <tr>
      <td @click="expand(data.id)"  class="tableItem">{{ data.id }}</td>    
      <td class="tableItem"> {{ data.code }} </td>
      <td class="tableItem"> {{ data.name || 'unknown' }} </td>
      <td class="tableItem"> {{ data.createBy }}</td>
      <td class="tableItem"> <button @click="item(data)" > <i class="fas fa-sync-alt" style="font-size:24px;"> </i></button></td>
    </tr>
    <tr v-for="red in reduce[data.id ].types">
      <td :class="{ 'ta' : id != data.id }" colspan="2"> {{ red.time }} </td>
      <td :class="{ 'ta' : id != data.id }" colspan="2"> {{ red.type }} </td>
    </tr>
    </tbody>`
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
    this.itemList = this.viewChain
    console.log(this.viewChain)
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
    expandItem: function (id) {
      (this.id == id) ? this.id = undefined: this.id = id
    },
    returnItem: async function (code) {
      // code = Object.assign(code, {
      //   timestamp
      // });
      // console.log(code);
      delete code.types;
      console.log(code)

      const response = await apiService.post('/api/return', code);
      alert(response.response)
      location.reload();
      // alert('Item cannot be returned again')

    },
  }


})