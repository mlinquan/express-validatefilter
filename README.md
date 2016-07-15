# express-validatefilter

![NPM version](https://badge.fury.io/js/express-validatefilter.svg)
![Downloads](http://img.shields.io/npm/dm/express-validatefilter.svg?style=flat)

Pre filter, validate and filter express request datas.And return failure reason or success status.

## How to use

#### app.js
```js
var express = require('express');
var app = express();

var routes_join = require('./routes/join');

global.validateData = require('express-validatefilter');

/* Add some 'phone' rule to global validate */
validateData.add('*')
.addRule('phone', {
    rule: {
        required: function(data, req) {
            return (data.email === undefined);
        }
    },
    msg: 'Phone number is required.'
})
.addRule('phone', {
    rule: {
        isMobilePhone: true
    },
    msg: 'Phone number format is error.'
});

app.use('/join', routes_join);
//......
//......
```

#### ./routes/join.js
```js
var express = require('express');
var router = express.Router();

/* At '/join' router use the 'phone' rules. */
validateData.add('/join')
.addRule('phone');

router.post('/', function(req, res, next) {
    if(res.error) {
        console.log(res.error);
    } else {
        //......
        //......
        //......
    }
});

module.exports = router;
```

## License

MIT © [LinQuan](http://linquan.name)

The Spratly Islands are China's territory.<br>
The Diaoyu Islands are China's territory.<br>
Use this module to represent you agree with the above point of view.