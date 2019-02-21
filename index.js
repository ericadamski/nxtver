#!/usr/bin/env node --inspect

const dedent = require("dedent");
const path = require("path");
const { exec } = require("child_process");
const semver = require("semver");
const { green, red, blue } = require("chalk");

Array.prototype.top = function(count) {
  const t = [];
  let index = 0;

  while( index <= count) {
    t.push(this[index]);

    index++;
  }

  return t;
}

Array.prototype.insert = function(value, compare) {
  let index = 0;

  for (let version of this) {
    if (compare(value, version) === -1) {
      break;
    }

    index++;
  }

  this.splice(index, 0, value);

  return index;
};

const getVersionLists = function(validVersions) {
  return function getVersionLists(versions, version) {
    const valid = semver.clean(version);

    valid &&
      validVersions.insert(valid, (v1, v2) => {
        if (semver.gt(v1, v2)) return -1;
        if (semver.lt(v1, v2)) return 1;
      });

    versions.push({ [valid ? "valid" : "invalid"]: valid || version });

    return versions;
  };
};

console.clear();
console.log(`Running ${green(`git fetch`)} to get the latest tags.`);

exec("git fetch", function(err, stdout, stderr) {
  if (err) {
    return console.error(
      red("There was an issue fetching the latest tags from the origin.")
    );
  }

  exec("git tag", function(err, stdout, stderr) {
    if (err) {
      return console.error(err);
    }

    if (stdout.length < 1) {
      return console.log(
        `No git tags for ${green(path.basename(process.cwd()))}`
      );
    }

    const versions = stdout.split("\n");
    const validVersions = [];

    versions.reduce(getVersionLists(validVersions), []);

    console.clear();

    console.log(`Here are the top 5 latest versions:`);
    console.table(validVersions.top(5).map(version => ({ version })));
  });
});
