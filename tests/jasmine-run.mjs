import glob from 'glob';
import Jasmine from 'jasmine';

const jasmine = new Jasmine();
jasmine.loadConfigFile('tests/jasmine.json');

// Load your mjs specs
glob('**/*_test.mjs', function (er, files) {
  Promise.all(
    files
      // Use relative paths
      .map(f => f.replace('tests/specs/', './specs/'))
      .map(f => import(f)
        .catch(e => {
          console.error('** Error loading ' + f + ': ');
          console.error(e);
          process.exit(1);
        }))
  )
  .then(() => jasmine.execute());
});
