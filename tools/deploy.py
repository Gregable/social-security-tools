"""This simple python script will deploy the github files to an S3 store."""

import datetime
import glob
import mimetypes
import os

import tinys3  # https://www.smore.com/labs/tinys3/


ROOT_DIR = os.path.expanduser("~/github/social-security-tools")
REMOTE_DIR = "beta"
S3_ACCESS_KEY = ""
S3_SECRET_KEY = ""
BUCKET = "socialsecurity.tools"


def LoadKeys(filename):
  global S3_ACCESS_KEY, S3_SECRET_KEY
  fp = open(filename, 'r')
  contents = fp.read()
  lines = contents.splitlines()
  S3_ACCESS_KEY, S3_SECRET_KEY = lines 


def PutS3(filename):
  content_type = mimetypes.guess_type(filename)[0]
  localfile = os.path.join(ROOT_DIR, filename)
  remotefile = os.path.join(REMOTE_DIR, filename)
  conn = tinys3.Connection(S3_ACCESS_KEY, S3_SECRET_KEY)
  datestr = datetime.datetime.now().strftime("%a, %d %b %Y %T %z")
  fp = open(localfile, 'rb')
  print localfile, content_type
  conn.upload(
      remotefile, fp, BUCKET, content_type=content_type,
      headers = {
        'x-amz-acl': 'public-read',
      })


LoadKeys(os.path.expanduser('~/.s3keys'))

# Values are paths relative to ROOT_DIR / REMOTE_DIR.
# Both keys and values represent globs.
RELEASE_FILES = [
  '*.html',
  '*paste.txt',
  'favicon.ico',
  'bootstrap.min.css',
  'stylesheet.css',
  'partials/*.html',
  'src/*.js',
  'static/*'
]

for globstr in RELEASE_FILES:
  os.chdir(ROOT_DIR)
  for filename in glob.glob(globstr):
    PutS3(filename)
