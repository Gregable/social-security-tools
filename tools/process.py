def ParseWageIndex():
  # Pasted from https://www.ssa.gov/oact/cola/awiseries.html
  f = open('wageindex.paste')
  lines = f.readlines()
  out = {}
  for line in lines:
    line = line.strip()
    if line[0] == '#':
      continue

    year, wage_index, _ = line.split('\t')
    wage_index = wage_index.replace(',', '')  # remove commas from numbers
    out[int(year)] = float(wage_index)
  return out


def PrintWageIndex():
  print "// Data from https://www.ssa.gov/oact/cola/awiseries.html"
  print "/** const */ var WAGE_INDICES = {"
  for year, wage in ParseWageIndex().items():
    print "  %d: %.02f," % (year, wage)
  print "};"


PrintWageIndex()
