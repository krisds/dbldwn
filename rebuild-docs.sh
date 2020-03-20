#!/bin/bash

node convert.js --in README.dbl.txt --as md --out README.md
# node convert.js --in README.dbl.txt --as html --out README.html

node convert.js --in doubledown.dbl.txt --as html --out doubledown.html
# node convert.js --in doubledown.dbl.txt --as md --out doubledown.md

node convert.js --in examples/markdown.dbl.txt --as html --out examples/markdown.html

node convert.js --in examples/school-of-illumination.dbl.txt --as html --out examples/school-of-illumination.html

# node convert.js --in examples/poe.dbl.txt --as json --out examples/poe.json
node convert.js --in examples/poe.dbl.txt --as html --out examples/poe.html
