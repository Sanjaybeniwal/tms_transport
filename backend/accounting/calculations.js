const { cents: c, money: m, sum } = require('./money');
const min = (a, b) => a < b ? a : b;
function settlement(trip, account, incomes = [], payments = [], expenses = [], diesels = [], advances = []) {
  const collected = sum(incomes), paid = sum(payments.filter(e => e.kind !== 'driver_adjustment'));
  const company = c(account.companyFreight) + c(account.additionalIncome) - c(account.companyDeduction);
  const owner = account.classification === 'Market' ? c(account.vehicleFreight) - c(account.ownerDeduction) : 0n;
  const costs = sum(expenses) + sum(diesels, 'totalAmount');
  const gross = c(account.companyFreight) - c(account.vehicleFreight);
  const net = company - owner - costs - c(account.brokerDeduction) - c(account.commissionExpense);
  const expected = account.classification === 'Market' ? net : 0n;
  // Conservative owner-first cash allocation. Collection is never equated with commission.
  const marginCash = account.classification === 'Market' && collected > owner ? min(collected - owner, expected > 0n ? expected : 0n) : 0n;
  const earned = trip.status === 'Completed' && account.classification === 'Market' ? expected : 0n;
  return {
    companyBilled: m(company), companyCollected: m(collected), companyOutstanding: m(company - collected),
    ownerFreight: m(owner), ownerAdvances: m(sum(payments.filter(e => e.kind === 'owner_advance'))), ownerPayments: m(paid), ownerOutstanding: m(owner - paid),
    freightIncome: account.classification === 'Own' ? m(c(account.companyFreight)) : '0.00',
    additionalIncome: m(c(account.additionalIncome)), totalExpenses: m(costs + c(account.brokerDeduction) + c(account.commissionExpense)), fuelExpenses: m(sum(diesels, 'totalAmount')),
    ownedIncome: account.classification === 'Own' ? m(company) : '0.00', ownedProfit: account.classification === 'Own' ? m(net) : '0.00',
    grossMargin: account.classification === 'Market' ? m(gross) : '0.00', expectedMargin: m(expected), earnedMargin: m(earned),
    commissionReceived: m(min(marginCash, earned > 0n ? earned : 0n)), commissionReceivable: m(earned > marginCash ? earned - marginCash : 0n),
    netBrokerageProfit: m(earned), settlementFunds: m(collected - paid - costs - sum(advances) + sum(payments.filter(e => e.kind === 'driver_adjustment'))),
    paymentStatus: company === collected ? 'Paid' : collected === 0n ? 'Unpaid' : 'Partial',
    ownerPaymentStatus: owner === paid ? 'Paid' : paid === 0n ? 'Unpaid' : 'Partial',
    paymentEligibility: !account.podRequired || (trip.podStatus === 'Approved' && account.podSubmissionDate) ? 'Eligible' : 'POD pending'
  };
}
module.exports = { settlement };
