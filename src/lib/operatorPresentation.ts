import {
  verifiedValue,
  type OperatorRecord,
  type RedemptionMinimum,
} from '../data/operators';

export function formatPartialIsoDate(value: string): string {
  if (/^\d{4}$/.test(value)) return value;
  if (/^\d{4}-(?:0[1-9]|1[0-2])$/.test(value)) {
    const [year, month] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  }
  if (/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    if (date.toISOString().slice(0, 10) === value) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date);
    }
  }
  return value;
}

function minimumLabel(value: RedemptionMinimum, kind: string): string {
  return `${kind} redemptions from ${value.amount} ${value.currency}`;
}

export function operatorFactNote(operator: OperatorRecord): string {
  const parts: string[] = [];
  const company = verifiedValue(operator.operatorName);
  const launch = verifiedValue(operator.launchDate);
  const signup = verifiedValue(operator.signupOffer);
  const daily = verifiedValue(operator.dailyOffer);
  const cash = verifiedValue(operator.cashRedemptionMinimum);
  const gift = verifiedValue(operator.giftCardRedemptionMinimum);
  const timing = verifiedValue(operator.publishedRedemptionTiming);
  const methods = verifiedValue(operator.paymentMethods);
  const games = verifiedValue(operator.gameCount);

  if (company) parts.push(`Operated by ${company}`);
  if (launch) parts.push(`published launch date ${formatPartialIsoDate(launch)}`);
  if (signup) parts.push(`published signup offer: ${signup}`);
  if (daily) parts.push(`published daily offer: ${daily}`);
  if (gift) parts.push(minimumLabel(gift, 'gift-card'));
  if (cash) parts.push(minimumLabel(cash, 'cash'));
  if (timing) parts.push(`published redemption estimate: ${timing}`);
  if (methods?.length) parts.push(`listed methods: ${methods.join(', ')}`);
  if (games !== undefined) {
    parts.push(`published game count: ${games.toLocaleString('en-US')}`);
  }
  return parts.length > 0
    ? `${parts.join('; ')}.`
    : 'Read the full review for the sourced details currently available.';
}
