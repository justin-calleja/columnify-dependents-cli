var pkgDependents = require('pkg-dependents');
var readPkgJSONInfoDict = require('pkg-json-info-dict').readPkgJSONInfoDict;
var path = require('path');
var columnify = require('columnify');
var createUpdateReportRows = require('update-dependents').createUpdateReportRows;
var meow = require('meow');

const cli = meow(`
    Usage:
        $ columnify-dependents [options]

    columnify-dependents is used to list packages, their dependents,
    and the versions these dependents use under their own
    dependencies / peerDependencies / devDependencies.

    The considered packages are the ones in paths added with the -a option
    (or just the current directory if no -a is used).

    Options:
        -h, --help            print usage information
        -v, --version         show version info and exit
        -a, --add <path>      add path in which to search for dependents
                 (defaults to current working directory if no -a is given)
`, {
  alias: {
    v: 'version',
    h: 'help',
    a: 'add'
  }
});

var paths = undefined;
if (Array.isArray(cli.flags.add)) {
  paths = cli.flags.add;
} else if (cli.flags.add !== undefined){
  paths = [cli.flags.add];
} else {
  paths = [process.cwd()];
}

readPkgJSONInfoDict(paths, (err, pkgJSONInfoDict) => {
  var dependentsDict = pkgDependents.allDependentsOf(pkgJSONInfoDict);

  var rowsData = [];
  Object.keys(pkgJSONInfoDict).forEach(pkgName => {
    var pkgJSONInfo = pkgJSONInfoDict[pkgName];
    var dependents = dependentsDict[pkgName];
    var rows = createUpdateReportRows(pkgJSONInfo, dependents);
    // if pkgJSONInfo has any dependents
    if (rows.length > 0){
      rowsData = rowsData.concat(rows);
      // push {} to introduce a new line separating each new package in the table listing
      rowsData.push({});
    }
  });

  var columns = columnify(rowsData, {
    columnSplitter: '   ',
    config: {
      depVersionRange: {headingTransform: () => 'DEP_VRANGE'},
      devDepVersionRange: {headingTransform: () => 'DEV_DEP_VRANGE'},
      peerDepVersionRange: {headingTransform: () => 'PEER_DEP_VRANGE'}
    }
  });
  console.log(columns);
});

