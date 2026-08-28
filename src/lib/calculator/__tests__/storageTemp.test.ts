import { describe, expect, it } from 'vitest'
import { estimateStorageTemp, formatStorageTemp } from '../storageTemp'

describe('estimateStorageTemp', () => {
  // Every row of reference/temp.jpg, checked at both ends of the band.
  it.each([
    [241, -10, '241–260'],
    [260, -10, '241–260'],
    [261, -11, '261–280'],
    [280, -11, '261–280'],
    [281, -12, '281–300'],
    [300, -12, '281–300'],
    [301, -13, '301–320'],
    [320, -13, '301–320'],
    [321, -14, '321–340'],
    [340, -14, '321–340'],
    [341, -15, '341–360'],
    [360, -15, '341–360'],
  ])('PAC %d → %d°C (band %s)', (pac, tempC, band) => {
    const e = estimateStorageTemp(pac)
    expect(e.tempC).toBe(tempC)
    expect(e.band).toBe(band)
    expect(e.withinTable).toBe(true)
  })

  it('handles a fractional PAC value', () => {
    expect(estimateStorageTemp(317.8).tempC).toBe(-13)
  })

  it('extrapolates above the table by the +20 PAC / -1°C rule', () => {
    const e = estimateStorageTemp(370)
    expect(e.tempC).toBe(-16)
    expect(e.withinTable).toBe(false)
    expect(formatStorageTemp(e)).toContain('推算')
  })

  it('extrapolates below the table', () => {
    const e = estimateStorageTemp(230)
    expect(e.tempC).toBe(-9)
    expect(e.withinTable).toBe(false)
  })

  it('formats an in-table value plainly', () => {
    expect(formatStorageTemp(estimateStorageTemp(290))).toBe('-12°C')
  })
})
