"""This simple python script will deploy the github files to an S3 store."""

import boto3
import datetime
import glob
import mimetypes
import time
import os
import tempfile

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

# Our release scheme consists of prefixing `src` and `partials` directories with
# a release version number when uploading, and then rewriting `src/` and
# `partials/` anywhere we find them in HTML with the versioned path. The point
# of this is to allow for long cache lifetimes (Cloudflare defaults to 7 days)
# without worrying about users using a mix of files and getting a broken
# experience.

# This release scheme is a little hacky, but works for a simple
# single-developer setup. There is a risk that we end up replacing "src" or
# "partials" somewhere it isn't part of the filename, but the odds are lowish.


def ReleaseFilename(filename):
  """Compute a release-specific filename for the given filename."""
  if filename.startswith('src/') or filename.startswith('partials/'):
    filename = "%s/%s" % (RELEASE_VERSION, filename)
  return filename


def RewriteReleasePaths(contents):
  contents = contents.replace('src/', "%s/src/" % RELEASE_VERSION)
  contents = contents.replace('partials/', "%s/partials/" % RELEASE_VERSION)
  return contents


def PutS3(filename):
  content_type = mimetypes.guess_type(filename)[0]
  # RSS feeds should be application/rss+xml according to W3C.
  # mimetypes gets this wrong.
  if content_type == "application/x-rss+xml":
    content_type = "application/rss+xml"

  localfile = os.path.join(ROOT_DIR, filename)
  remotefile = os.path.join(REMOTE_DIR, ReleaseFilename(filename))
  client = boto3.client('s3', aws_access_key_id=S3_ACCESS_KEY,
                        aws_secret_access_key=S3_SECRET_KEY)
  datestr = datetime.datetime.now().strftime("%a, %d %b %Y %T %z")

  # Read the file, rewriting any release paths if necessary:
  fp = open(localfile, 'rb')
  contents = fp.read()
  final = ""
  if (content_type != "text/html"):
    final = contents
  else:
    print "Rewriting contents: %s" % localfile
    final = RewriteReleasePaths(contents)

  # Use a temp file to manage the upload, since we can't just upload a string.
  tfp = tempfile.TemporaryFile()
  tfp.write(final)
  tfp.seek(0)

  print localfile, remotefile, content_type
  client.upload_fileobj(
      tfp, BUCKET, remotefile, ExtraArgs={'ContentType': content_type,
                                          'ACL': 'public-read'})


LoadKeys(os.path.expanduser('~/.s3keys'))

# Values are paths relative to ROOT_DIR / REMOTE_DIR.
# Both keys and values represent globs.
RELEASE_FILES = [
    '*.html',
    '*paste.txt',
    'sitemap.xml',
    'robots.txt',
    'favicon.ico',
    'partials/*.html',
    'guide/*.html',
    'guide/*.mjs',
    'guide/feed.rss',
    'src/stylesheet.css',
    'src/*.mjs',
    'src/guide/*.mjs',
    'static/*'
]

# The release version is determined when this script starts up and is literally
# just a timestamp to the nearest second of when the script was run.
RELEASE_VERSION = "%d" % time.time()

for globstr in RELEASE_FILES:
  os.chdir(ROOT_DIR)
  for filename in glob.glob(globstr):
    PutS3(filename)
