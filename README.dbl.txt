[meta]
    - Title: DoubleDown - README
    - Author: krisds

# DoubleDown

[image logo.svg width 50%]

See <<doubledown.dbl.txt>>[link doubledown.dbl.txt] (or <<the HTML
version>>[link doubledown.html]) for an overview of the DoubleDown syntax.


## Installing

1. Install <<node.js>>[link https://nodejs.org/en/].
2. Run:
    [code]
        > npm install
3. Set up your path to include the `dbldwn/` folder.


## Using

Just create a text file containing DoubleDown markup. No specific extension
required, but please use `.dbl.txt` for clarity.

### HTML

To convert a file to HTML:

[code]
    > dbldwn --in <your file> --as html --out <html file>

### JSON

To convert a file to JSON:

[code]
    > dbldwn --in <your file> --as json --out <json file>

### Markdown

To convert a file to Markdown:

[code]
    > dbldwn --in <your file> --as md --out <markdown file>

**Note:** Markdown conversion is currently incomplete. By design it may also
be lossy, depending on the input document.

