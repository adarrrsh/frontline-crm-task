/** Fixed demo rates: the worker's minimum pay is in USD, so other currencies are converted before comparing. */
export const USD_PER = {
  USD: 1,
  CHF: 1.25,
};

export const currencyOf = (job) => job.currency ?? 'USD';

export const payInUsd = (job) => job.payPerHour * USD_PER[currencyOf(job)];

/** "$20", "CHF 26" */
export const formatMoney = (amount, currency = 'USD') => (currency === 'USD' ? `$${amount}` : `${currency} ${amount}`);
