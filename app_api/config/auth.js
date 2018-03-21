/**
 * http://usejsdoc.org/
 */
// expose our config directly to our application using module.exports

var pfConfig = require('../controllers/utilities.controller').getConfig();
module.exports = {
    'googleAuth' : {
        'clientID'      : '1082374922907-cnup3giaqgganhi0vbt31ntq38mod5gp.apps.googleusercontent.com',
        'clientSecret'  : 'lAMMqPTrn7ZEdqiTpkoXnZwS',
        'callbackURL'   : pfConfig.hostUrl+'/auth/google/callback'
    }

};