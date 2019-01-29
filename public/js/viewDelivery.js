Vue.component('table-item', {
  props: ['data', 'item'],
  template: `<tr>
    <td class="tableItem">{{ data.id }}</td>
    <td class="tableItem">{{ data.timestamp }}</td>
    <td class="tableItem">{{ data.type }}</td>
    <td class="tableItem"> {{ data.code }} </td>
    <td class="tableItem"> {{ data.name || 'unknown' }} </td>
    <td class="tableItem"> {{ data.createBy }}</td>
    <td class="tableItem"> <button @click="item(data)" > <i class="fas fa-sync-alt" style="font-size:24px;"> </i></button></td>
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

    this.viewChain = await apiService.get('/api/block');
    let removeDups = this.checkDuplicates(this.viewChain);
    this.viewChain = this.viewChain.filter(x => removeDups.includes(x.timestamp) && x.type == "DISPATCH");
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
    checkDuplicates: function (array) {
      let compare = [];
      let dups = {};
      // console.log(compare)
      let value = [...new Set(array.map(x => x.timestamp))]
      console.log(value)
      array.forEach(element => {
        dups[element.timestamp] ? dups[element.timestamp].push(element.type) : dups[element.timestamp] = [element.type];
      });
      value.forEach(element => {
        if (dups[element].includes("RETURN") || dups[element].includes("DELIVERED")) {
          delete dups[element];
        }
      })
      return Object.keys(dups);

    },
    deliverItem: async function (code) {
      const response = await apiService.post('/api/delivery', code);
      alert(response.response)
      location.reload();

    },
  }


})