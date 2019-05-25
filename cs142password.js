var crypto = require('crypto');

var makePasswordEntry = function(clearTextPassword) {

  var bytes = crypto.randomBytes(8);
  var saltGiven = bytes.toString('hex');
  var shaAlgorithm = crypto.createHash('sha1');
  var password = clearTextPassword + saltGiven;
  shaAlgorithm.update(password);
  var hashedPassword = shaAlgorithm.digest('hex');
  return {"hash": hashedPassword.toString(), "salt" : saltGiven};
};

var doesPasswordMatch = function(hash, salt, clearTextPassword) {
  var testPassword = clearTextPassword + salt;
  var shaAlgorithm = crypto.createHash('sha1');
  shaAlgorithm.update(testPassword);
  var newHashPassword = shaAlgorithm.digest('hex');
  return hash === newHashPassword.toString();
};

var cs142password = {'makePasswordEntry' : makePasswordEntry, 'doesPasswordMatch': doesPasswordMatch};

module.exports = cs142password;
