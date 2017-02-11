# social-security-tools
Website Source for https://socialsecurity.tools/

The code here is what's statically served at that site, minus the tools/
directory which contains some python for extracting numbers from the ssa.gov
site.

To run locally, simply place the code in the same directory structure as in
this repository and run any static web server. On linux, I use python's
SimpleHTTPServer as it is convenient:

```
$ python -m SimpleHTTPServer 8000 
```
