# social-security-tools

Website Source for <https://ssa.tools/>, formerly <https://socialsecurity.tools/>

The code here builds what is statically served at that site.

## Running Locally

The website can be run locally as a Docker container. You will need git and Docker.

```
git clone https://github.com/Gregable/social-security-tools.git
cd social-security-tools
docker build -t ssa-tools .
docker run -p 127.0.0.1:4173:4173 --name=ssatools ssa-tools
```

Then load https://localhost:4173/ in your browser.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Gregable/social-security-tools&type=Date)](https://star-history.com/#Gregable/social-security-tools&Date)
