# def-parser
This is a library that can take def file content and convert it into a js object.

# Assumptions:
* None of the keys will have regex
* There is no strict checking based off of assignnment type, all that is check is if a value should be within a problem or global
* There is no validation done on the CLI for the file reading since this is currently for testing

# Usage
## CLI
There is currently a CLI that is used for testing.  It's only parameter is the path to the def file.  
```bash
npm start -- ./examples/set4.8_LHopitals_Rule.def
npm start -- ./examples/setMidterm_Exam.def
```
