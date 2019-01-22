const apiService = {
  get: async function (url) {
    const data = await fetch(url);
    return data.json()

  },
  post: async function (url, data) {
    const result = await fetch(url, {
      method: 'post',
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      },
      body: JSON.stringify(data)
    })
    console.log(result)
    return result.json();
  },
}