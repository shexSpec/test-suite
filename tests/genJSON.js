#!/usr/bin/env node

// Parse arguments
var args = process.argv.slice(2);
if (args > 1 || args.indexOf("-help") !== -1 || args.indexOf("--help") !== -1) {
  console.error('usage: genJSON manifest.ttl > manifest.jsonld');
  return process.exit(1);
}

var fs = require('fs');
var N3 = require("n3");
var parser = N3.Parser();
var util = N3.Util;
var store = N3.Store();
//var json = fs.readFileSync(args[0]).toString();

var P = {
  "mf": "http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#",
  "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
  "mf": "http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#",
  "shext":   "http://www.w3.org/ns/shextest#"
};

var apparentBase = __dirname + "/manifest";
var stripPath = apparentBase.length;
parser.parse(
  "@base <" + apparentBase + "> .\n"+
  fs.readFileSync(args[0], "utf8"),
  function (error, triple, prefixes) {
    if (triple)
      store.addTriple(triple)
    else
      genText();
  });

function genText () {
  var g = [];
  var ret = {
    "@context": "https://raw.githubusercontent.com/shexSpec/test-suite/gh-pages/tests/manifest-context.jsonld",
    "@graph": g
  };
  store.addPrefixes(P);
  var manifest = store.find(null, "rdf:type", "mf:Manifest")[0].subject;
  var manifestComment = util.getLiteralValue(store.find(manifest, "rdfs:comment", null)[0].object);
  var entries = [];
  var head = store.find(manifest, "mf:entries", null)[0].object;
  while (head !== P.rdf + "nil") {
    entries.push(store.find(head, "rdf:first", null)[0].object);
    head = store.find(head, "rdf:rest", null)[0].object;
  }
  g.push({
    "@id": "http://shexspec.github.io/test-suite/tests/manifest.ttl",
    "@type": "mf:Manifest",
    "rdfs:comment": manifestComment,
    "mf:entries": entries
  });
  var expectedTypes = ["NotValid", "PositiveSyntax", "Valid", "ValidationTest"].map(function (suffix) {
    return P.shext + suffix;
  });
  store.find(null, "rdf:type", null).filter(function (t) {
    return expectedTypes.indexOf(t.object) !== -1;
  }).map(function (t) {
    return [t.subject, t.object];
  }).sort(function (l, r) {
    return entries.indexOf(l[0].substr(stripPath, 999)) >
      entries.indexOf(r[0].substr(stripPath, 999));
  }).forEach(function (st) {
    var s = st[0], t = st[1];
    g.push([
//      ["rdf"  , "type"    , function (v) { return v.substr(P.shext.length); }],
      ["mf"   , "name"    , function (v) { return util.getLiteralValue(v); }],
      ["rdfs" , "comment" , function (v) { return util.getLiteralValue(v); }],
      ["shext", "status"  , function (v) { return "mf:"+v.substr(P.mf.length);   }],
      ["shext", "schema"  , function (v) { return v.substr(stripPath-8); }],
      ["shext", "shape"   , function (v) { return v;   }],
      ["shext", "data"    , function (v) { return v.substr(stripPath-8); }],
      ["shext", "focus"   , function (v) { return v;   }],
      ["shext", "result"  , function (v) { return v.substr(stripPath-8); }]
    ].reduce(function (ret, row) {
      var found = store.findByIRI(s, P[row[0]]+row[1], null);
      // console.log(found);
      if (found.length)
        ret[row[1]] = row[2](found[0].object);
      return ret;
    }, {"@id": s.substr(stripPath), "@type": "shext:"+t.substr(P.shext.length)}));
  });
  console.log(JSON.stringify(ret, null, "  "));
}
