// ~500 transactions generated deterministically across members, categories,
// and a 14-month date range (Jan 2025 – Feb 2026) for meaningful chart trends.

const CATEGORIES = ['Shopping', 'Dining', 'Utilities', 'Transfer', 'Payroll', 'Healthcare', 'Travel', 'Investment', 'Insurance', 'Miscellaneous']
const DESCRIPTIONS = {
  Shopping:     ['Online Purchase - Amazon', 'Retail - Target', 'Grocery - Whole Foods', 'Electronics - Best Buy', 'Clothing - Nordstrom'],
  Dining:       ['Restaurant - The Rusty Flagon', 'Coffee - Starbucks', 'Food Delivery - DoorDash', 'Restaurant - Olive Garden', 'Bar Tab - The Bannered Mare'],
  Utilities:    ['Electric Bill - Whiterun Power', 'Water Bill - City Utilities', 'Internet - Comcast', 'Gas Bill - NordicGas', 'Phone Bill - AT&T'],
  Transfer:     ['Wire Transfer Out', 'Internal Transfer', 'ACH Transfer Out', 'Wire Transfer In', 'ACH Transfer In'],
  Payroll:      ['Direct Deposit - Employer', 'Payroll Credit', 'Bonus Payment', 'Commission Credit', 'Salary Advance'],
  Healthcare:   ['Pharmacy - CVS', 'Doctor Visit - Copay', 'Dental Office', 'Vision Center', 'Hospital Bill'],
  Travel:       ['Flight - United Airlines', 'Hotel - Marriott', 'Car Rental - Hertz', 'Taxi - Lyft', 'Train Ticket - Amtrak'],
  Investment:   ['Brokerage Deposit', 'Mutual Fund Purchase', 'Stock Purchase', 'Bond Purchase', 'Dividend Reinvestment'],
  Insurance:    ['Auto Insurance - GEICO', 'Home Insurance Premium', 'Life Insurance Premium', 'Health Insurance Premium', 'Renters Insurance'],
  Miscellaneous:['ATM Withdrawal', 'Bank Fee', 'Interest Payment', 'Subscription - Netflix', 'Subscription - Spotify'],
}
const STATUSES = ['Cleared', 'Cleared', 'Cleared', 'Cleared', 'Pending', 'Flagged']
const MEMBER_IDS = Array.from({ length: 100 }, (_, i) => `MBR-${String(i + 1).padStart(4, '0')}`)

// Simple deterministic pseudo-random from a seed
function seededRand(seed) {
  let s = seed
  return function () {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateTransactions() {
  const rand = seededRand(42)
  const transactions = []
  let txNum = 1

  // Spread ~500 transactions across 14 months (Jan 2025 – Feb 2026)
  const startDate = new Date('2025-01-01')
  const endDate   = new Date('2026-02-28')
  const dayRange  = Math.floor((endDate - startDate) / 86400000)

  for (let i = 0; i < 500; i++) {
    const memberId   = MEMBER_IDS[Math.floor(rand() * 100)]
    const accountNum = Math.floor(rand() * 145) + 1
    const accountId  = `ACC-${String(accountNum).padStart(4, '0')}`
    const category   = CATEGORIES[Math.floor(rand() * CATEGORIES.length)]
    const desc       = DESCRIPTIONS[category][Math.floor(rand() * 5)]
    const status     = STATUSES[Math.floor(rand() * STATUSES.length)]
    const isCredit   = category === 'Payroll' || (category === 'Transfer' && rand() > 0.6)
    const type       = isCredit ? 'Credit' : 'Debit'

    // Amount varies by category
    let amount
    if (category === 'Payroll')    amount = 2000 + Math.floor(rand() * 8000)
    else if (category === 'Investment') amount = 500 + Math.floor(rand() * 9500)
    else if (category === 'Transfer')   amount = 200 + Math.floor(rand() * 4800)
    else if (category === 'Travel')     amount = 100 + Math.floor(rand() * 1900)
    else if (category === 'Insurance')  amount = 80  + Math.floor(rand() * 520)
    else                                amount = 10  + Math.floor(rand() * 490)

    const dayOffset = Math.floor(rand() * dayRange)
    const date = new Date(startDate)
    date.setDate(date.getDate() + dayOffset)
    const dateStr = date.toISOString().split('T')[0]

    transactions.push({
      id:          `TXN-${String(txNum).padStart(5, '0')}`,
      accountId,
      memberId,
      date:        dateStr,
      type,
      amount:      parseFloat(amount.toFixed(2)),
      description: desc,
      status,
      category,
    })
    txNum++
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
  return transactions
}

const transactions = generateTransactions()

export default transactions
