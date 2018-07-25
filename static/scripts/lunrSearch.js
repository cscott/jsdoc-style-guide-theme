document.addEventListener( 'DOMContentLoaded', function () {
  var idx, documents;
  var searchEl = document.getElementById( 'lunr-search' );

  searchEl.addEventListener( 'keyup', function () {
    search( this.value );
  } );

  function search( term ) {
    if ( term === '' ) {
      showResults([]);
    } else if ( idx !== undefined ) {
      // We want exact matches as well as prefix search
      // So we get both, merge and de-duplicate
      var results = mergeResults(
        idx.search( term ),
        idx.search( term + '*' )
      );
      showResults( results );
    } else {
      loadData().then( function (data) {
        idx = lunr.Index.load( data.index );
        documents = data.documents;
        search( term );
      });
    }
  }

  function showResults( results ) {
    // Get details of results
    var docs = documents.filter( function ( d ) {
      return results.indexOf( d.id ) > -1;
    }).map( function ( d ) {
      return {
        id: d.id,
        name: d.name,
        longname: d.longname,
        summary: d.summary || ''
      };
    });

    var ul = document.getElementById( 'search-results' );
    ul.innerHTML = '';

    docs.forEach( function ( d ) {
      var link = '<a href="'+d.id+'">';
      link += '<dt>'+ d.name + ' &middot; <code>'+d.longname+'</code></dt>'
      link += '<dd>'+ d.summary + '</dd>'
      link += '</a>'
      ul.innerHTML += '<li>' + link + '</li>';
    });
  }

  function loadData() {
    // We'll have to load a JS file if we are on file://
    if ( location.protocol.substr(0, 4) === 'http' ) {
      return loadJSON();
    } else {
      return loadJS();
    }
  }

  function loadJSON() {
    return new Promise( function (resolve, reject ) {
      fetch( '/lunr-data.json').then( function ( res ) {
        resolve( res.json() );
      } );
    } );
  }

  function loadJS() {
    return new Promise( function ( resolve, reject ) {
      var s = document.createElement( 'script' );
      s.setAttribute( 'src', 'lunr-data.js' );
      document.body.appendChild( s );
      s.onload = function () {
        resolve( window.lunrData );
      }
    } );
  }

  function mergeResults( r1, r2 ) {
    var a = r1.concat( r2 );

    // Remove scores and metadata before looking for uniques
    a = a.map( function ( r ) {
      return r.ref;
    });

    // Keep uniques
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
  }

} );
