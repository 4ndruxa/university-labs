import type { TestData } from './indicators'

/** Умова ПР1: 36 зразків, 4 інтервали за 40 год; відмови 3, 6, 8, решта — в останньому */
export const PR1_TASK: TestData = { n0: 36, totalTime: 40, failures: [3, 6, 8, 19] }
export const PR1_INTERVAL = 2
