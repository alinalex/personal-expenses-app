export default function formatTransactionsPerCategory({ transactions }: { transactions: any[] }) {
  // console.log('transactions', transactions);
  const response: { outer: { total: number, categories: { [k: string]: any } }, inner: { total: number, categories: { [k: string]: any } }, chartData: any[], domain: number[] } = {
    outer: {
      total: 0,
      categories: {}
    },
    inner: {
      total: 0,
      categories: {}
    },
    chartData: [],
    domain: []
  }

  for (let index = 0; index < transactions.length; index++) {
    const element = transactions[index];
    const key = element.amount > 0 ? 'inner' : 'outer';
    if (element.amount > 0) {
      if (element.transaction_type === 'Incoming funds' && (element.transaction_info.includes('Ordering party: Rauta Alexandru Alin') || element.transaction_info.includes('Beneficiary, Rauta Alexandru Alin') || element.transaction_info.includes('Ordering party: FLIP TECHNOLOGIES' || element.transaction_info.includes('Ordering party, FLIP TECHNOLOGIES')))) {
        continue;
      }
    } else {
      if (element.transaction_type === `Transfer Home'Bank` && element.transaction_info.includes('Beneficiary: Rauta Alexandru Alin')) {
        continue;
      }
    }

    response[key].total += element.amount;
    if (Object.hasOwn(response[key].categories, element.transaction_categories.category_name)) {
      response[key].categories[element.transaction_categories.category_name].total += element.amount;
      response[key].categories[element.transaction_categories.category_name].transactions.push(element);
    } else {
      response[key].categories[element.transaction_categories.category_name] = {
        total: element.amount,
        transactions: [element]
      };
    }
  }

  for (const [key, value] of Object.entries(response.outer.categories)) {
    response.chartData.push({
      name: key,
      value: Math.ceil(value.total * -1),
    });
    const max = response.domain[1];
    if (typeof max === 'undefined') response.domain[1] = Math.ceil(value.total * -1);
    if (Math.ceil(value.total * -1) > max) response.domain[1] = Math.ceil(value.total * -1);
  }

  for (const [key, value] of Object.entries(response.inner.categories)) {
    response.chartData.push({
      name: key,
      value: Math.ceil(value.total * -1),
    });
    const min = response.domain[0];
    if (typeof min === 'undefined') response.domain[0] = Math.ceil(value.total * -1);
    if (Math.ceil(value.total * -1) < min) response.domain[0] = Math.ceil(value.total * -1);
  }

  if (typeof response.domain[0] === 'undefined') response.domain[0] = 0;
  if (typeof response.domain[1] === 'undefined') response.domain[1] = 0;

  // console.log('total', (response.outer.total + response.inner.total).toFixed(2));
  // console.log('inner', response.inner.total.toFixed(2));
  // console.log('outer', response.outer.total.toFixed(2));
  // console.log('response', response.inner.categories);
  return response;
}