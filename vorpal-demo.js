// Vorpal secure-coding scan demo — intentionally vulnerable code.
// This file is meant to trigger Vorpal review annotations on a pull request.

const { exec } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

// 1) Hardcoded credential
const DATABASE_PASSWORD = 'P@ssw0rd123';

// 2) Command injection — unsanitized input concatenated into a shell command
function listFiles(userInput) {
  exec('ls -la ' + userInput, (error, stdout) => {
    console.log(stdout);
  });
}

// 3) SQL injection — string concatenation into a query
function loadUser(username) {
  const sql = "SELECT * FROM users WHERE username = '" + username + "'";
  return runQuery(sql);
}

// 4) Weak hashing — MD5 used for passwords
function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

// 5) Insecure randomness — Math.random used to generate a token
function makeToken() {
  return Math.random().toString(36).substring(2);
}

// 6) Path traversal — user input used directly in a file path
function readUserFile(name) {
  return fs.readFileSync('/data/' + name, 'utf8');
}

// 7) Dynamic code execution — eval() on user input
function runScript(code) {
  return eval(code);
}

module.exports = {
  DATABASE_PASSWORD,
  listFiles,
  loadUser,
  hashPassword,
  makeToken,
  readUserFile,
  runScript
};
