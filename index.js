var Q = require("q");
var validator = require("validator");
var util = require('util'); 
var validateData = {
	routes: {
	},
	rules: {
	},
	methods: {
		required: function(path, rule, msg) {
			return function(value, data, req) {
        var deferred = Q.defer();
        var must = true;
				if(typeof rule.required == 'function') {
					must = rule.required(data, req);
				}
				if(must && data[path] !== undefined && data[path].length == 0) {
					deferred.reject(msg);
				} else {
					deferred.resolve();
				}
				return deferred.promise;
      };
		},
    isEmail: function(path, rule, msg) {
      return function(value, data, req) {
        var deferred = Q.defer();
        if(!validator.isEmail(value, {allow_display_name:false})) {
          deferred.reject(msg);
        } else {
          deferred.resolve();
        }
        return deferred.promise;
      };
    },
    isMobilePhone: function(path, rule, msg) {
      return function(value, data, req) {
        var deferred = Q.defer();
        if(!validator.isMobilePhone(value, 'zh-CN')) {
          deferred.reject(msg);
        } else {
          deferred.resolve();
        }
        return deferred.promise;
      };
    },
    equalTo: function(path, rule, msg) {
      return function(value, data, req) {
        var deferred = Q.defer();
        if(value != data[rule.equalTo]) {
          deferred.reject(msg);
        } else {
          deferred.resolve();
        }
        return deferred.promise;
      };
    },
    promise: function(path, rule, msg) {
      return function(value, data, req) {
        var deferred = Q.defer();
        if(typeof rule.promise != 'function') {
          return new Error(rule.promise + 'is not a function.');
        }
        rule.promise(value, data, req, msg, deferred);
        return deferred.promise;
      };
    },
    regExp: function(path, rule, msg) {
      return function(value, data, req) {
        var deferred = Q.defer();
        var rege = rule.regExp;
        if(typeof rule.regExp == 'function') {
          rege = rule.regExp(value, data, req, msg);
        }
        if(!rege.test(value)) {
          deferred.reject(msg);
        } else {
          deferred.resolve();
        }
        return deferred.promise;
      };
    }
	},
	validate: function(req, res, next) {
		if(!req) {
      return next();
    }
		var _this = this;
		var url = req.originalUrl;
    var routes = _this.routes[url];
    var rules = _this.rules[url];
    var rule_list = [];
    var queue = [];
    var data = req.body;
    var ruleIndex = 0;
    if(!routes) {
      return next();
    }
    if(!rules) {
      return next();
    }
    for(var rule in rules) {
      rule_list.push(rule);
    }
    var contrast = {};
    var ruleListLength = rule_list.length;
    var returnData = {};
    var errorLength = 0;
    var _queue = function() {
      if(ruleIndex == ruleListLength) {
        if(errorLength > 0) {
          if(req.xhr) {
            return res.send(JSON.stringify(returnData));
          }
          res.error = returnData;
        }
        res.contrast = contrast;
        return next();
      }
      var ruleItem = rule_list[ruleIndex];
      var queueItems = rules[ruleItem];
      var queueItemsLength = queueItems.length;
      var queueForPath = [];
      queueItems.forEach(function(queueItem) {
        queueForPath.push(queueItem(data[ruleItem], data, req));
      });
      Q.all(queueForPath)
      .then(function(result) {
        returnData[ruleItem] = {
          status: 'success'
        };
        result.forEach(function(resultItem) {
          if(resultItem && resultItem.contrast) {
            contrast = util._extend(contrast, JSON.parse(JSON.stringify(resultItem.contrast)))
          }
        });
        ruleIndex++;
        _queue();
      }, function(error) {
        returnData[ruleItem] = {
          status: 'error',
          reason: error
        };
        errorLength++;
        ruleIndex++;
        if(routes.error_break) {
          returnData = {
            status: 'error',
            reason: error
          };
          ruleIndex = ruleListLength;
        }
        _queue();
      });
    }
    _queue();
	},
	add: function(url, error_break) {
		var _this = this;
		if(!url || url == '*') {
			url = '_GLOBAL';
		}
    if(_this.routes[url]) {
      return _this.routes[url];
    }
		_this.routes[url] = {
			error_break: !!error_break,
			addRule: function(path, rule) {
				if(!_this.rules[url]) {
					_this.rules[url] = {};
				}
				if(!_this.rules[url][path]) {
					_this.rules[url][path] = [];
				}
				var queueItem;
        if(!rule && url != '_GLOBAL' && _this.rules['_GLOBAL'][path]) {
          _this.rules[url][path] = _this.rules['_GLOBAL'][path];
          return _this.routes[url];
        }
				for(var method in rule.rule) {
					if(_this.methods[method]) {
						queueItem = _this.methods[method](path, rule.rule, rule.msg);
					}
				}
	      _this.rules[url][path].push(queueItem);
				return _this.routes[url];
			}
		};
		return _this.routes[url];
	},
	addMethod: function(method) {
		var _this = this;
		return _this;
	}
};

module.exports = validateData;