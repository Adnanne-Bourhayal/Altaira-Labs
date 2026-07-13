export type SavingsCalculatorInput = {
  hoursPerWeek: number
  hourlyCost: number
  lostLeadsPerMonth: number
  averageClientValue: number
  improvementPercent: number
}

export type SavingsCalculatorEstimate = {
  savedHoursWeekly: number
  weeklyTimeValue: number
  monthlyValue: number
  annualValue: number
  leadValue: number
}

export function calculateSavingsEstimate(input: SavingsCalculatorInput): SavingsCalculatorEstimate {
  const savedHoursWeekly = input.hoursPerWeek * (input.improvementPercent / 100)
  const weeklyTimeValue = savedHoursWeekly * input.hourlyCost
  const recoveredLeadValue = input.lostLeadsPerMonth * input.averageClientValue * (input.improvementPercent / 100)
  const monthlyValue = weeklyTimeValue * 4.33 + recoveredLeadValue

  return {
    savedHoursWeekly,
    weeklyTimeValue,
    monthlyValue,
    annualValue: monthlyValue * 12,
    leadValue: recoveredLeadValue,
  }
}
