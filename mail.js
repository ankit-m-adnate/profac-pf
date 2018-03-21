var imaps = require('imap-simple');
var crypto = require('crypto');
var fs = require('fs')


function create_appsecret_proof(){
    var accessToken = "EAADVyNldjI8BAK30hOxkzgzNtZCRJN8qHIpXty5P3ZBgrOxiwef2R2jK50FU9vc44ULM4BDYxEi95Ea86guLyyZA5k1G5kx1eAZBsRcKEqPpa7UMCPnDOhcZA7fATGxK77Wa1nVC4IfYkw7ZBZAypkTt8wZAvM726SoZD";
    var appSecret = "3b78e1e425cd6746dbb7904ca9cb6236";
    console.log("APPSECRET_PROOF::"+crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex'));

}
create_appsecret_proof();
//saveAttachments();
