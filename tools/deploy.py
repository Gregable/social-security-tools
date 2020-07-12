"""This simple python script will deploy the github files to an S3 store."""

import boto3
import datetime
import glob
import mimetypes
import os

ROOT_DIR = os.path.expanduser("~/github/social-security-tools")
REMOTE_DIR = ""
S3_ACCESS_KEY = ""
S3_SECRET_KEY = ""
BUCKET = "ssa.tools"


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
  client = boto3.client('s3', aws_access_key_id=S3_ACCESS_KEY,
                        aws_secret_access_key=S3_SECRET_KEY)
  datestr = datetime.datetime.now().strftime("%a, %d %b %Y %T %z")
  fp = open(localfile, 'rb')
  print localfile, content_type
  client.upload_fileobj(fp, BUCKET, remotefile, ExtraArgs={'ContentType': content_type,
                                                           'ACL': 'public-read'})


LoadKeys(os.path.expanduser('~/.s3keys'))

# Values are paths relative to ROOT_DIR / REMOTE_DIR.
# Both keys and values represent globs.
RELEASE_FILES = [
    '*.html',
    '*paste.txt',
    'favicon.ico',
    'stylesheet.css',
    'partials/*.html',
    'guide/*.html',
    'guide/*.mjs',
    'src/*.mjs',
    'static/*'
]

for globstr in RELEASE_FILES:
  os.chdir(ROOT_DIR)
  for filename in glob.glob(globstr):
    PutS3(filename)
