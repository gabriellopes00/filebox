import { calculaIdade } from '@filebox/shared'
const test = /^\d+$/.test('30') ? ' é um número' : ' não é um número'
const asdf = new RegExp('^[a-zA-Z]+$')
// function t() {
//   const test = 'dd'
//   console.log(calculaIdade(30) + test)
// }
console.log(calculaIdade(30) + test)
