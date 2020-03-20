# DoubleDown

![logo.svg](logo.svg)

See [doubledown.dbl.txt](doubledown.dbl.txt) (or [the HTML
version](doubledown.html)) for an overview of the DoubleDown syntax.

## Installing

1. Install [node.js](https://nodejs.org/en/).

2. Run:

  ```
npm install
```

3. Set up your path to include the `dbldwn/` folder.


## Using

Just create a text file containing DoubleDown markup. No specific extension
required, but please use `.dbl.txt` for clarity.

### HTML

To convert a file to HTML:

```
dbldwn --in <your file> --as html --out <html file>
```
### JSON

To convert a file to JSON:

```
dbldwn --in <your file> --as json --out <json file>
```
### Markdown

To convert a file to Markdown:

```
dbldwn --in <your file> --as md --out <markdown file>
```
**Note:** Markdown conversion is currently incomplete. By design it may also
be lossy, depending on the input document.

