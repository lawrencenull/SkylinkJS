var sharedIEConfig = require('../shared/karma-ie.conf.js');

module.exports = function(config){

  var file = ['../../test-karma/sdp-test.js'];

  sharedIEConfig(config);

  config.files = config.files.concat(file);
  
}