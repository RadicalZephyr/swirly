// Entry point for the test run. Node 16 cannot discover test files on its own,
// so each suite is imported explicitly.
import './golden.js'
import './measurement.js'
import './parsing.js'
import './rendering.js'
