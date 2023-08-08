import Header from './components/Header.svelte'

const header = new Header({
  target: document.getElementById('header'),
  props: {active: document.getElementById('header').getAttribute('active')}
})

export default header
