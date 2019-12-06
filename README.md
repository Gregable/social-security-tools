# social-security-tools
Website Source for https://ssa.tools/, formerly https://socialsecurity.tools/

The code here is what's statically served at that site, minus the tools/
directory which contains some python for extracting numbers from the ssa.gov
site and deployment.

To run locally, simply place the code in the same directory structure as in
this repository and run any static web server. On linux, I use python's
SimpleHTTPServer as it is convenient:

```
$ python -m SimpleHTTPServer 8000 
```

If you're using Python 3.x, you can instead run:

```
$ python -m http.server
```
