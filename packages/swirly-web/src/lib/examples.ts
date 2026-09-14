import dedent from 'dedent'

import { Example } from './types.js'

export const examples: readonly Example[] = [
  {
    title: 'concatAll',
    code: dedent(`
      x = ----a------b------|

      y = ---c-d---|

      z = ---e--f-|

      -x---y----z------|

      > concatAll

      -----a------b---------c-d------e--f-|
    `)
  },
  {
    title: 'debounce',
    code: dedent(`
      -a--bc--d---|

      > debounce(() => \`--|\`)

      ---a---c--d-|
    `)
  },
  {
    title: 'exhaustAll',
    code: dedent(`
      x = --a---b---c--|

      y = ---d--e---f---|

      z = ---g--h---i---|

      ------x-------y------z--|
      ghosts = y

      > exhaustAll

      --------a---b---c-------g--h---i---|
    `)
  },
  {
    title: 'onErrorResumeNext',
    code: dedent(`
      --a--b--#
      title = source

      --c--d--|
      title = next

      > onErrorResumeNext

      --a--b----c--d--|
      title = output
    `)
  },
  {
    title: 'pluck',
    code: dedent(`
      [styles]
      event_radius = 30
      operator_height = 60

      --a--b--c--|
      a := {v:1}
      b := {v:2}
      c := {v:3}

      > pluck('v')

      --x--y--z--|
      x := 1
      y := 2
      z := 3
    `)
  },
  {
    title: 'skipUntil',
    code: dedent(`
      --a--b--c--d--e----|

      ---------x------|

      > skipUntil

      -----------d--e----|
    `)
  },
  {
    title: 'zipAll',
    code: dedent(`
      x = -a-----b-|

      y = --1-2-----

      -x----y--------|

      > zipAll

      -----------------A----B-|
      A := a1
      B := b2
    `)
  },
  {
    title: 'gridAxis',
    code: dedent(`
      @ t | 0 | 1 | 2

      > s |  |  |
    `)
  },
  {
    title: 'gridStreams',
    code: dedent(`
      @ t | 0 | 1 | 2 | 3 | 4

      > s1 | 0 |    | 2  |    |

      > s2 |   | 10 | 20 | 30 |
    `)
  },
  {
    title: 'gridCell',
    code: dedent(`
      @ t | 0 | 1 | 2 | 3 | 4 | 5

      = c | 'a' |  | 'b' |  | 'c' |
    `)
  },
  {
    title: 'gridHold',
    code: dedent(`
      @ t | 0 | 1 | 2 | 3 | 4 | 5

      = c | 'a' |  | 'b' |  | 'c' |
      to = 5

      > s1 |  | 'b' |  | 'c' |  |
    `)
  },
  {
    title: 'gridSwitch',
    code: dedent(`
      @ t | 0 | 1 | 2 | 3 | 4

      = c1 | 'a' | 'b' | 'c' | 'd' | 'e'

      = c2 | 'V' | 'W' | 'X' | 'Y' | 'Z'

      = c3 | c1 |  | c2 |  |

      = c4 | 'a' | 'b' | 'X' | 'Y' | 'Z'
    `)
  },
  {
    title: 'gridAnnotations',
    code: dedent(`
      @ t | 0 | 1 | 2 | 3 | 4 | 5

      = c | 'a' |  | 'b' |  |  |
      to = 3

      . a1 |  | 'a' |  |  |  |

      . a2 |  |  | 'b' |  |  |
    `)
  },
  {
    title: 'gridNested',
    code: dedent(`
      @ t | [0] | >[0,0] | >[0,1] | [1] | >[1,0]

      > s1 | ['a','b'] |  |  | ['c'] |

      > s2 |  | 'a' | 'b' |  | 'c'
    `)
  }
]
