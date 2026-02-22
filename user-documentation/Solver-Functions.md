# Solver Functions

A complete reference of all functions available in solver expressions. Functions are case-insensitive.

See the [Solver Expression Walkthrough](Solver-Expression-Walkthrough.md) for an introduction or [Advanced Topics](Solver-Expressions-Advanced.md) for scope rules and complex patterns.

## Conditional

- [if](solverfunctions/if.md) -- Conditional comparison: `if(left, operator, right, trueValue, falseValue)`
- [when](solverfunctions/when.md) -- Truthy check: `when(value, trueResult, falseResult)`

## Math

- [abs](solverfunctions/abs.md) -- Absolute value
- [ceil](solverfunctions/ceil.md) -- Round up to nearest integer
- [compare](solverfunctions/compare.md) -- Compare two values
- [cos](solverfunctions/cos.md) -- Cosine (radians)
- [euler](solverfunctions/euler.md) -- Euler's number (e)
- [exp](solverfunctions/exp.md) -- Exponential (e^x)
- [floor](solverfunctions/floor.md) -- Round down to nearest integer
- [log](solverfunctions/log.md) -- Natural logarithm
- [percent](solverfunctions/percent.md) -- Percentage calculation
- [pi](solverfunctions/pi.md) -- Pi constant
- [rad](solverfunctions/rad.md) -- Degrees to radians
- [round](solverfunctions/round.md) -- Round to decimal places
- [sin](solverfunctions/sin.md) -- Sine (radians)
- [sqrt](solverfunctions/sqrt.md) -- Square root
- [tan](solverfunctions/tan.md) -- Tangent (radians)
- [tofixed](solverfunctions/tofixed.md) -- Format to fixed decimal places

## Statistics

- [avg](solverfunctions/avg.md) -- Average (alias for mean)
- [count](solverfunctions/count.md) -- Count elements in array
- [countset](solverfunctions/countset.md) -- Count set elements
- [countsetelements](solverfunctions/countsetelements.md) -- Count elements in histogram
- [max](solverfunctions/max.md) -- Maximum value
- [mean](solverfunctions/mean.md) -- Arithmetic mean
- [median](solverfunctions/median.md) -- Median value
- [min](solverfunctions/min.md) -- Minimum value
- [mode](solverfunctions/mode.md) -- Most frequent value
- [stdev](solverfunctions/stdev.md) -- Sample standard deviation
- [stdeva](solverfunctions/stdeva.md) -- Sample standard deviation (alias)
- [stdevp](solverfunctions/stdevp.md) -- Population standard deviation
- [sum](solverfunctions/sum.md) -- Sum of values
- [var](solverfunctions/var.md) -- Sample variance
- [vara](solverfunctions/vara.md) -- Sample variance (alias)
- [varp](solverfunctions/varp.md) -- Population variance

## String

- [concat](solverfunctions/concat.md) -- Concatenate with spaces
- [concatraw](solverfunctions/concatraw.md) -- Concatenate without spaces
- [join](solverfunctions/join.md) -- Join with separator
- [joinraw](solverfunctions/joinraw.md) -- Join without entity resolution
- [resolvehtmlentities](solverfunctions/resolvehtmlentities.md) -- Resolve HTML entities
- [stringcountsegments](solverfunctions/stringcountsegments.md) -- Count string segments
- [stringgetsegments](solverfunctions/stringgetsegments.md) -- Split string into segments

## Array & Set Operations

- [arrayconcat](solverfunctions/arrayconcat.md) -- Concatenate arrays
- [differencearrays](solverfunctions/differencearrays.md) -- Set difference of two arrays
- [flatten](solverfunctions/flatten.md) -- Flatten nested arrays
- [setconcatenate](solverfunctions/setconcatenate.md) -- Concatenate sets
- [slice](solverfunctions/slice.md) -- Extract a portion of an array
- [sortarray](solverfunctions/sortarray.md) -- Sort an array
- [sortset](solverfunctions/sortset.md) -- Sort a set with precision
- [unionarrays](solverfunctions/unionarrays.md) -- Set union of two arrays
- [uniquearray](solverfunctions/uniquearray.md) -- Remove duplicates from array

## Set Inspection

- [bucketset](solverfunctions/bucketset.md) -- Bucket values into ranges
- [entryinset](solverfunctions/entryinset.md) -- Get entry from set by index
- [largestinset](solverfunctions/largestinset.md) -- Largest value in a set
- [smallestinset](solverfunctions/smallestinset.md) -- Smallest value in a set

## Cumulative Operations

- [cumulativesummation](solverfunctions/cumulativesummation.md) -- Running total over a set
- [iterativeseries](solverfunctions/iterativeseries.md) -- Iterative computation over array
- [subtractingsummation](solverfunctions/subtractingsummation.md) -- Running subtraction over a set

## Histogram & Aggregation

- [aggregationhistogram](solverfunctions/aggregationhistogram.md) -- Sum values grouped by field (from AppData path)
- [aggregationhistogrambyobject](solverfunctions/aggregationhistogrambyobject.md) -- Sum values grouped by field (from object)
- [distributionhistogram](solverfunctions/distributionhistogram.md) -- Count occurrences by field (from AppData path)
- [distributionhistogrambyobject](solverfunctions/distributionhistogrambyobject.md) -- Count occurrences by field (from object)
- [sorthistogram](solverfunctions/sorthistogram.md) -- Sort histogram by values
- [sorthistogrambykeys](solverfunctions/sorthistogrambykeys.md) -- Sort histogram by keys

## Value Access

- [getvalue](solverfunctions/getvalue.md) -- Read value from application state
- [setvalue](solverfunctions/setvalue.md) -- Write value to application state
- [getvaluearray](solverfunctions/getvaluearray.md) -- Gather multiple values into array
- [getvalueobject](solverfunctions/getvalueobject.md) -- Gather multiple values into object
- [createvalueobjectbyhashes](solverfunctions/createvalueobjectbyhashes.md) -- Create object from hash references

## Object & Array Utilities

- [cleanvaluearray](solverfunctions/cleanvaluearray.md) -- Remove empty values from array
- [cleanvalueobject](solverfunctions/cleanvalueobject.md) -- Remove empty values from object
- [createarrayfromabsolutevalues](solverfunctions/createarrayfromabsolutevalues.md) -- Create array from absolute values
- [generatearrayofobjectsfromsets](solverfunctions/generatearrayofobjectsfromsets.md) -- Generate objects from sets
- [objectkeystoarray](solverfunctions/objectkeystoarray.md) -- Extract object keys as array
- [objectvaluestoarray](solverfunctions/objectvaluestoarray.md) -- Extract object values as array
- [objectvaluessortbyexternalobjectarray](solverfunctions/objectvaluessortbyexternalobjectarray.md) -- Sort object values by external array

## Search

- [findfirstvaluebyexactmatch](solverfunctions/findfirstvaluebyexactmatch.md) -- Find first matching entry in array
- [findfirstvaluebystringincludes](solverfunctions/findfirstvaluebystringincludes.md) -- Find first entry containing a string
- [match](solverfunctions/match.md) -- Find index of value in array (spreadsheet-style MATCH)

## Date

- [datefromparts](solverfunctions/datefromparts.md) -- Create date from year, month, day, etc.
- [datemilliseconddifference](solverfunctions/datemilliseconddifference.md) -- Milliseconds between two dates
- [dateseconddifference](solverfunctions/dateseconddifference.md) -- Seconds between two dates
- [dateminutedifference](solverfunctions/dateminutedifference.md) -- Minutes between two dates
- [datehourdifference](solverfunctions/datehourdifference.md) -- Hours between two dates
- [datedaydifference](solverfunctions/datedaydifference.md) -- Days between two dates
- [dateweekdifference](solverfunctions/dateweekdifference.md) -- Weeks between two dates
- [datemonthdifference](solverfunctions/datemonthdifference.md) -- Months between two dates
- [dateyeardifference](solverfunctions/dateyeardifference.md) -- Years between two dates
- [datemathadd](solverfunctions/datemathadd.md) -- Add time to a date (generic)
- [dateaddmilliseconds](solverfunctions/dateaddmilliseconds.md) -- Add milliseconds to a date
- [dateaddseconds](solverfunctions/dateaddseconds.md) -- Add seconds to a date
- [dateaddminutes](solverfunctions/dateaddminutes.md) -- Add minutes to a date
- [dateaddhours](solverfunctions/dateaddhours.md) -- Add hours to a date
- [dateadddays](solverfunctions/dateadddays.md) -- Add days to a date
- [dateaddweeks](solverfunctions/dateaddweeks.md) -- Add weeks to a date
- [dateaddmonths](solverfunctions/dateaddmonths.md) -- Add months to a date
- [dateaddyears](solverfunctions/dateaddyears.md) -- Add years to a date

## Random Data Generation

- [randominteger](solverfunctions/randominteger.md) -- Random integer
- [randomintegerbetween](solverfunctions/randomintegerbetween.md) -- Random integer in range
- [randomintegerupto](solverfunctions/randomintegerupto.md) -- Random integer up to max
- [randomfloat](solverfunctions/randomfloat.md) -- Random float
- [randomfloatbetween](solverfunctions/randomfloatbetween.md) -- Random float in range
- [randomfloatupto](solverfunctions/randomfloatupto.md) -- Random float up to max

## Regression & Matrix

- [gaussianelimination](solverfunctions/gaussianelimination.md) -- Gaussian elimination
- [leastsquares](solverfunctions/leastsquares.md) -- Least squares regression
- [linest](solverfunctions/linest.md) -- Linear regression (alias for leastsquares)
- [matrixinverse](solverfunctions/matrixinverse.md) -- Inverse of a matrix
- [matrixmultiply](solverfunctions/matrixmultiply.md) -- Multiply two matrices
- [matrixtranspose](solverfunctions/matrixtranspose.md) -- Transpose a matrix
- [matrixvectormultiply](solverfunctions/matrixvectormultiply.md) -- Multiply matrix by vector
- [polynomialregression](solverfunctions/polynomialregression.md) -- Polynomial regression fit
- [predict](solverfunctions/predict.md) -- Predict from regression model

## Form UI Control

These functions control the visual appearance and behavior of the running form.

- [colorgroupbackground](solverfunctions/colorgroupbackground.md) -- Set group background color
- [colorinputbackground](solverfunctions/colorinputbackground.md) -- Set input background color
- [colorinputbackgroundtabular](solverfunctions/colorinputbackgroundtabular.md) -- Set tabular cell background color
- [colorsectionbackground](solverfunctions/colorsectionbackground.md) -- Set section background color
- [disablesolverordinal](solverfunctions/disablesolverordinal.md) -- Disable a solver execution ordinal
- [enablesolverordinal](solverfunctions/enablesolverordinal.md) -- Enable a solver execution ordinal
- [generatehtmlhexcolor](solverfunctions/generatehtmlhexcolor.md) -- Generate hex color from RGB values
- [hidesections](solverfunctions/hidesections.md) -- Hide form sections
- [refreshtabularsection](solverfunctions/refreshtabularsection.md) -- Refresh tabular display
- [runsolvers](solverfunctions/runsolvers.md) -- Re-run all solver expressions
- [setgroupvisibility](solverfunctions/setgroupvisibility.md) -- Set group visibility
- [setsectionvisibility](solverfunctions/setsectionvisibility.md) -- Set section visibility
- [setsolverordinalenabled](solverfunctions/setsolverordinalenabled.md) -- Enable or disable solver ordinal
- [settabularrowlength](solverfunctions/settabularrowlength.md) -- Set tabular row count
- [showsections](solverfunctions/showsections.md) -- Show form sections

## Debugging

- [logvalues](solverfunctions/logvalues.md) -- Log values to browser console

## Operators

| Operator | Description | Precedence |
|----------|-------------|------------|
| `^` | Exponentiation | Highest |
| `*` `/` `%` | Multiply, Divide, Modulus | High |
| `+` `-` | Add, Subtract | Medium |
| `,` | Set concatenation | Low |
| `=` | Assignment | Lowest |
| `?=` | Null coalescence assignment | Lowest |

## Expression Syntax

### MAP

```
Result = MAP VAR x FROM ArrayValue : x * 2
```

### SERIES

```
Result = SERIES FROM 0 TO 100 STEP 5 : n^2
```

### MONTECARLO

```
Result = MONTECARLO SAMPLECOUNT 1000 VAR x PT x 0 PT x 100 : x^2
```
