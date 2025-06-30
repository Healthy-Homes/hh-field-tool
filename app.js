function loadEJData() {
  fetch('./data/sample-ejscreen.json')
    .then(res => res.json())
    .then(data => {
      document.getElementById('output').textContent = JSON.stringify(data, null, 2);
    })
    .catch(err => {
      document.getElementById('output').textContent = 'Error loading data.';
      console.error(err);
    });
}
