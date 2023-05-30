/*****************************************
********** Motor MooTools - MIT **********
*****************************************/

var MooTools = {
	'version': '1.2.1',
	'build': '0d4845aab3d9a4fdee2f0d4a6dd59210e4b697cf'
};

var Native = function(options){
	options = options || {};
	var name = options.name;
	var legacy = options.legacy;
	var protect = options.protect;
	var methods = options.implement;
	var generics = options.generics;
	var initialize = options.initialize;
	var afterImplement = options.afterImplement || function(){};
	var object = initialize || legacy;
	generics = generics !== false;
	object.constructor = Native;
	object.$family = {name: 'native'};
	if (legacy && initialize) object.prototype = legacy.prototype;
	object.prototype.constructor = object;
	if (name){
		var family = name.toLowerCase();
		object.prototype.$family = {name: family};
		Native.typize(object, family);
	}
	var add = function(obj, name, method, force){
		if (!protect || force || !obj.prototype[name]) obj.prototype[name] = method;
		if (generics) Native.genericize(obj, name, protect);
		afterImplement.call(obj, name, method);
		return obj;
	};
	object.alias = function(a1, a2, a3){
		if (typeof a1 == 'string'){
			if ((a1 = this.prototype[a1])) return add(this, a2, a1, a3);
		}
		for (var a in a1) this.alias(a, a1[a], a2);
		return this;
	};
	object.implement = function(a1, a2, a3){
		if (typeof a1 == 'string') return add(this, a1, a2, a3);
		for (var p in a1) add(this, p, a1[p], a2);
		return this;
	};
	if (methods) object.implement(methods);
	return object;
};

Native.genericize = function(object, property, check){
	if ((!check || !object[property]) && typeof object.prototype[property] == 'function') object[property] = function(){
		var args = Array.prototype.slice.call(arguments);
		return object.prototype[property].apply(args.shift(), args);
	};
};

Native.implement = function(objects, properties){
	for (var i = 0, l = objects.length; i < l; i++) objects[i].implement(properties);
};

Native.typize = function(object, family){
	if (!object.type) object.type = function(item){
		return ($type(item) === family);
	};
};

(function(){
	var natives = {'Array': Array, 'Date': Date, 'Function': Function, 'Number': Number, 'RegExp': RegExp, 'String': String};
	for (var n in natives) new Native({name: n, initialize: natives[n], protect: true});
	var types = {'boolean': Boolean, 'native': Native, 'object': Object};
	for (var t in types) Native.typize(types[t], t);
	var generics = {
		'Array': ["concat", "indexOf", "join", "lastIndexOf", "pop", "push", "reverse", "shift", "slice", "sort", 
			"splice", "toString","unshift", "valueOf"], 'String': ["charAt", "charCodeAt", "concat", "indexOf", 
			"lastIndexOf", "match", "replace", "search", "slice", "split", "substr", "substring", "toLowerCase", 
			"toUpperCase", "valueOf"]
	};
	for (var g in generics){
		for (var i = generics[g].length; i--;) Native.genericize(window[g], generics[g][i], true);
	};
})();

var Hash = new Native({
	name: 'Hash',
	initialize: function(object){
		if ($type(object) == 'hash') object = $unlink(object.getClean());
		for (var key in object) this[key] = object[key];
		return this;
	}
});

Hash.implement({
	forEach: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key)) fn.call(bind, this[key], key, this);
		}
	},
	getClean: function(){
		var clean={};
		for (var key in this){
			if (this.hasOwnProperty(key)) clean[key]=this[key];
		}
		return clean;
	},
	getLength: function(){
		var length=0;
		for (var key in this){
			if (this.hasOwnProperty(key)) length++;
		}
		return length;
	}
});

Hash.alias('forEach', 'each');

Array.implement({
	forEach: function(fn, bind){
		for (var i=0, l=this.length; i < l; i++) fn.call(bind, this[i], i, this);
	}
});

Array.alias('forEach', 'each');

function $A(iterable){
	if (iterable.item){
		var array=[];
		for (var i=0, l=iterable.length; i<l; i++) array[i]=iterable[i];
		return array;
	}
	return Array.prototype.slice.call(iterable);
};

function $arguments(i){
	return function(){
		return arguments[i];
	};
};

function $chk(obj){
	return !!(obj || obj===0);
};

function $clear(timer){
	clearTimeout(timer);
	clearInterval(timer);
	return null;
};

function $defined(obj){
	return (obj!=undefined);
};

function $each(iterable, fn, bind){
	var type=$type(iterable);
	((type=='arguments' || type=='collection' || type=='array') ? Array:Hash).each(iterable, fn, bind);
};

function $empty(){};

function $extend(original, extended){
	for (var key in (extended || {})) original[key]=extended[key];
	return original;
};

function $H(object){
	return new Hash(object);
};

function $lambda(value){
	return (typeof value=='function') ? value:function(){
		return value;
	};
};

function $merge(){
	var mix={};
	for (var i=0, l=arguments.length; i<l; i++){
		var object=arguments[i];
		if ($type(object)!='object') continue;
		for (var key in object){
			var op=object[key], mp=mix[key];
			mix[key]=(mp && $type(op)=='object' && $type(mp)=='object') ? $merge(mp, op):$unlink(op);
		}
	}
	return mix;
};

function $pick(){
	for (var i=0, l=arguments.length; i<l; i++){
		if (arguments[i]!=undefined) return arguments[i];
	}
	return null;
};

function $random(min, max){
	return Math.floor(Math.random()*(max - min + 1)+min);
};

function $splat(obj){
	var type = $type(obj);
	return (type) ? ((type != 'array' && type != 'arguments') ? [obj] : obj) : [];
};

var $time = Date.now || function(){
	return +new Date;
};

function $try(){
	for (var i = 0, l = arguments.length; i < l; i++){
		try {
			return arguments[i]();
		} catch(e){}
	}
	return null;
};

function $type(obj){
	if (obj == undefined) return false;
	if (obj.$family) return (obj.$family.name == 'number' && !isFinite(obj)) ? false : obj.$family.name;
	if (obj.nodeName){
		switch (obj.nodeType){
			case 1: return 'element';
			case 3: return (/\S/).test(obj.nodeValue) ? 'textnode' : 'whitespace';
		}
	} else if (typeof obj.length == 'number'){
		if (obj.callee) return 'arguments';
		else if (obj.item) return 'collection';
	}
	return typeof obj;
};

function $unlink(object){
	var unlinked;
	switch ($type(object)){
		case 'object':
			unlinked = {};
			for (var p in object) unlinked[p] = $unlink(object[p]);
		break;
		case 'hash':
			unlinked = new Hash(object);
		break;
		case 'array':
			unlinked = [];
			for (var i = 0, l = object.length; i < l; i++) unlinked[i] = $unlink(object[i]);
		break;
		default: return object;
	}
	return unlinked;
};

/* El nucleo del navegador. Contiene la inicializacion en el navegador, las ventana del juego, documents y
   la implementacion para distintos navegadores */

var Browser = $merge({
	Engine: {name: 'unknown', version: 0},
	Platform: {name: (window.orientation != undefined) ? 'ipod' : (navigator.platform.match(/mac|win|linux/i) || 
		['other'])[0].toLowerCase()},
	Features: {xpath: !!(document.evaluate), air: !!(window.runtime), query: !!(document.querySelector)},
	Plugins: {},
	Engines: {
		presto: function(){
			return (!window.opera) ? false : ((arguments.callee.caller) ? 960 : ((document.getElementsByClassName) ? 950 : 925));
		},
		trident: function(){
			return (!window.ActiveXObject) ? false : ((window.XMLHttpRequest) ? 5 : 4);
		},
		webkit: function(){
			return (navigator.taintEnabled) ? false : ((Browser.Features.xpath) ? ((Browser.Features.query) ? 525 : 420) : 419);
		},
		gecko: function(){
			return (document.getBoxObjectFor == undefined) ? false : ((document.getElementsByClassName) ? 19 : 18);
		}
	}
}, Browser || {});

Browser.Platform[Browser.Platform.name] = true;

Browser.detect = function(){
	for (var engine in this.Engines){
		var version = this.Engines[engine]();
		if (version){
			this.Engine = {name: engine, version: version};
			this.Engine[engine] = this.Engine[engine + version] = true;
			break;
		}
	}
	return {name: engine, version: version};
};

Browser.detect();

Browser.Request = function(){
	return $try(function(){
		return new XMLHttpRequest();
	}, function(){
		return new ActiveXObject('MSXML2.XMLHTTP');
	});
};

Browser.Features.xhr = !!(Browser.Request());

Browser.Plugins.Flash = (function(){
	var version = ($try(function(){
		return navigator.plugins['Shockwave Flash'].description;
	}, function(){
		return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
	}) || '0 r0').match(/\d+/g);
	return {version: parseInt(version[0] || 0 + '.' + version[1] || 0), build: parseInt(version[2] || 0)};
})();

function $exec(text){
	if (!text) return text;
	if (window.execScript){
		window.execScript(text);
	} else {
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script[(Browser.Engine.webkit && Browser.Engine.version < 420) ? 'innerText' : 'text'] = text;
		document.head.appendChild(script);
		document.head.removeChild(script);
	}
	return text;
};

Native.UID = 1;

var $uid = (Browser.Engine.trident) ? function(item){
	return (item.uid || (item.uid = [Native.UID++]))[0];
} : function(item){
	return item.uid || (item.uid = Native.UID++);
};

var Window = new Native({
	name: 'Window',
	legacy: (Browser.Engine.trident) ? null: window.Window,
	initialize: function(win){
		$uid(win);
		if (!win.Element){
			win.Element = $empty;
			if (Browser.Engine.webkit) win.document.createElement("iframe"); //fixes safari 2
			win.Element.prototype = (Browser.Engine.webkit) ? window["[[DOMElement.prototype]]"] : {};
		}
		win.document.window = win;
		return $extend(win, Window.Prototype);
	},
	afterImplement: function(property, value){
		window[property] = Window.Prototype[property] = value;
	}
});

Window.Prototype = {$family: {name: 'window'}};

new Window(window);

var Document = new Native({
	name: 'Document',
	legacy: (Browser.Engine.trident) ? null: window.Document,
	initialize: function(doc){
		$uid(doc);
		doc.head = doc.getElementsByTagName('head')[0];
		doc.html = doc.getElementsByTagName('html')[0];
		if (Browser.Engine.trident && Browser.Engine.version <= 4) $try(function(){
			doc.execCommand("BackgroundImageCache", false, true);
		});
		if (Browser.Engine.trident) doc.window.attachEvent('onunload', function() {
			doc.window.detachEvent('onunload', arguments.callee);
			doc.head = doc.html = doc.window = null;
		});
		return $extend(doc, Document.Prototype);
	},
	afterImplement: function(property, value){
		document[property] = Document.Prototype[property] = value;
	}

});

Document.Prototype = {$family: {name: 'document'}};

new Document(document);

/* Contiene los prototipos de array necesarios como each, contains y erase */

Array.implement({
	every: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (!fn.call(bind, this[i], i, this)) return false;
		}
		return true;
	},
	filter: function(fn, bind){
		var results = [];
		for (var i = 0, l = this.length; i < l; i++){
			if (fn.call(bind, this[i], i, this)) results.push(this[i]);
		}
		return results;
	},
	clean: function() {
		return this.filter($defined);
	},
	indexOf: function(item, from){
		var len = this.length;
		for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++){
			if (this[i] === item) return i;
		}
		return -1;
	},
	map: function(fn, bind){
		var results = [];
		for (var i = 0, l = this.length; i < l; i++) results[i] = fn.call(bind, this[i], i, this);
		return results;
	},
	some: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (fn.call(bind, this[i], i, this)) return true;
		}
		return false;
	},
	associate: function(keys){
		var obj = {}, length = Math.min(this.length, keys.length);
		for (var i = 0; i < length; i++) obj[keys[i]] = this[i];
		return obj;
	},
	link: function(object){
		var result = {};
		for (var i = 0, l = this.length; i < l; i++){
			for (var key in object){
				if (object[key](this[i])){
					result[key] = this[i];
					delete object[key];
					break;
				}
			}
		}
		return result;
	},
	contains: function(item, from){
		return this.indexOf(item, from) != -1;
	},
	extend: function(array){
		for (var i = 0, j = array.length; i < j; i++) this.push(array[i]);
		return this;
	},
	getLast: function(){
		return (this.length) ? this[this.length - 1] : null;
	},
	getRandom: function(){
		return (this.length) ? this[$random(0, this.length - 1)] : null;
	},
	include: function(item){
		if (!this.contains(item)) this.push(item);
		return this;
	},
	combine: function(array){
		for (var i = 0, l = array.length; i < l; i++) this.include(array[i]);
		return this;
	},
	erase: function(item){
		for (var i = this.length; i--; i){
			if (this[i] === item) this.splice(i, 1);
		}
		return this;
	},
	empty: function(){
		this.length = 0;
		return this;
	},
	flatten: function(){
		var array = [];
		for (var i = 0, l = this.length; i < l; i++){
			var type = $type(this[i]);
			if (!type) continue;
			array = array.concat((type == 'array' || type == 'collection' || type == 'arguments') ? Array.flatten(this[i]) : this[i]);
		}
		return array;
	},
	hexToRgb: function(array){
		if (this.length != 3) return null;
		var rgb = this.map(function(value){
			if (value.length == 1) value += value;
			return value.toInt(16);
		});
		return (array) ? rgb : 'rgb(' + rgb + ')';
	},
	rgbToHex: function(array){
		if (this.length < 3) return null;
		if (this.length == 4 && this[3] == 0 && !array) return 'transparent';
		var hex = [];
		for (var i = 0; i < 3; i++){
			var bit = (this[i] - 0).toString(16);
			hex.push((bit.length == 1) ? '0' + bit : bit);
		}
		return (array) ? hex : '#' + hex.join('');
	}

});

/* Contiene los prototipos de funciones como create, bind, pass y delay */

Function.implement({
	extend: function(properties){
		for (var property in properties) this[property] = properties[property];
		return this;
	},
	create: function(options){
		var self = this;
		options = options || {};
		return function(event){
			var args = options.arguments;
			args = (args != undefined) ? $splat(args) : Array.slice(arguments, (options.event) ? 1 : 0);
			if (options.event) args = [event || window.event].extend(args);
			var returns = function(){
				return self.apply(options.bind || null, args);
			};
			if (options.delay) return setTimeout(returns, options.delay);
			if (options.periodical) return setInterval(returns, options.periodical);
			if (options.attempt) return $try(returns);
			return returns();
		};
	},
	run: function(args, bind){
		return this.apply(bind, $splat(args));
	},
	pass: function(args, bind){
		return this.create({bind: bind, arguments: args});
	},
	bind: function(bind, args){
		return this.create({bind: bind, arguments: args});
	},
	bindWithEvent: function(bind, args){
		return this.create({bind: bind, arguments: args, event: true});
	},
	attempt: function(args, bind){
		return this.create({bind: bind, arguments: args, attempt: true})();
	},
	delay: function(delay, bind, args){
		return this.create({bind: bind, arguments: args, delay: delay})();
	},
	periodical: function(periodical, bind, args){
		return this.create({bind: bind, arguments: args, periodical: periodical})();
	}
});

/* Contiene los prototipos numericos como limit, round, times y ceil */

Number.implement({
	limit: function(min, max){
		return Math.min(max, Math.max(min, this));
	},
	round: function(precision){
		precision = Math.pow(10, precision || 0);
		return Math.round(this * precision) / precision;
	},
	times: function(fn, bind){
		for (var i = 0; i < this; i++) fn.call(bind, i, this);
	},
	toFloat: function(){
		return parseFloat(this);
	},
	toInt: function(base){
		return parseInt(this, base || 10);
	}
});

Number.alias('times', 'each');

(function(math){
	var methods = {};
	math.each(function(name){
		if (!Number[name]) methods[name] = function(){
			return Math[name].apply(null, [this].concat($A(arguments)));
		};
	});
	Number.implement(methods);
})(['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'sin', 'sqrt', 'tan']);

/* Contiene los prototipos de String como camelCase, capitalize, test y toInt */

String.implement({
	test: function(regex, params){
		return ((typeof regex == 'string') ? new RegExp(regex, params) : regex).test(this);
	},
	contains: function(string, separator){
		return (separator) ? (separator + this + separator).indexOf(separator + string + separator) > -1 : this.indexOf(string) > -1;
	},
	trim: function(){
		return this.replace(/^\s+|\s+$/g, '');
	},

	clean: function(){
		return this.replace(/\s+/g, ' ').trim();
	},
	camelCase: function(){
		return this.replace(/-\D/g, function(match){
			return match.charAt(1).toUpperCase();
		});
	},
	hyphenate: function(){
		return this.replace(/[A-Z]/g, function(match){
			return ('-' + match.charAt(0).toLowerCase());
		});
	},
	capitalize: function(){
		return this.replace(/\b[a-z]/g, function(match){
			return match.toUpperCase();
		});
	},
	escapeRegExp: function(){
		return this.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
	},
	toInt: function(base){
		return parseInt(this, base || 10);
	},
	toFloat: function(){
		return parseFloat(this);
	},
	hexToRgb: function(array){
		var hex = this.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
		return (hex) ? hex.slice(1).hexToRgb(array) : null;
	},
	rgbToHex: function(array){
		var rgb = this.match(/\d{1,3}/g);
		return (rgb) ? rgb.rgbToHex(array) : null;
	},
	stripScripts: function(option){
		var scripts = '';
		var text = this.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function(){
			scripts += arguments[1] + '\n';
			return '';
		});
		if (option === true) $exec(scripts);
		else if ($type(option) == 'function') option(scripts, text);
		return text;
	},
	substitute: function(object, regexp){
		return this.replace(regexp || (/\\?\{([^{}]+)\}/g), function(match, name){
			if (match.charAt(0) == '\\') return match.slice(1);
			return (object[name] != undefined) ? object[name] : '';
		});
	}
});

/* Contiene los prototipos Hash. Proporciona un medio para superar la imposibilidad pr?ctica de extender objetos JavaScript nativos. */

Hash.implement({
	has: Object.prototype.hasOwnProperty,
	keyOf: function(value){
		for (var key in this){
			if (this.hasOwnProperty(key) && this[key] === value) return key;
		}
		return null;
	},
	hasValue: function(value){
		return (Hash.keyOf(this, value) !== null);
	},
	extend: function(properties){
		Hash.each(properties, function(value, key){
			Hash.set(this, key, value);
		}, this);
		return this;
	},
	combine: function(properties){
		Hash.each(properties, function(value, key){
			Hash.include(this, key, value);
		}, this);
		return this;
	},
	erase: function(key){
		if (this.hasOwnProperty(key)) delete this[key];
		return this;
	},
	get: function(key){
		return (this.hasOwnProperty(key)) ? this[key] : null;
	},
	set: function(key, value){
		if (!this[key] || this.hasOwnProperty(key)) this[key] = value;
		return this;
	},
	empty: function(){
		Hash.each(this, function(value, key){
			delete this[key];
		}, this);
		return this;
	},
	include: function(key, value){
		var k = this[key];
		if (k == undefined) this[key] = value;
		return this;
	},
	map: function(fn, bind){
		var results = new Hash;
		Hash.each(this, function(value, key){
			results.set(key, fn.call(bind, value, key, this));
		}, this);
		return results;
	},
	filter: function(fn, bind){
		var results = new Hash;
		Hash.each(this, function(value, key){
			if (fn.call(bind, value, key, this)) results.set(key, value);
		}, this);
		return results;
	},
	every: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key) && !fn.call(bind, this[key], key)) return false;
		}
		return true;
	},
	some: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key) && fn.call(bind, this[key], key)) return true;
		}
		return false;
	},
	getKeys: function(){
		var keys = [];
		Hash.each(this, function(value, key){
			keys.push(key);
		});
		return keys;
	},
	getValues: function(){
		var values = [];
		Hash.each(this, function(value){
			values.push(value);
		});
		return values;
	},
	toQueryString: function(base){
		var queryString = [];
		Hash.each(this, function(value, key){
			if (base) key = base + '[' + key + ']';
			var result;
			switch ($type(value)){
				case 'object': result = Hash.toQueryString(value, key); break;
				case 'array':
					var qs = {};
					value.each(function(val, i){
						qs[i] = val;
					});
					result = Hash.toQueryString(qs, key);
				break;
				default: result = key + '=' + encodeURIComponent(value);
			}
			if (value != undefined) queryString.push(result);
		});
		return queryString.join('&');
	}
});

Hash.alias({keyOf: 'indexOf', hasValue: 'contains'});

/* Contiene los eventos nativos, para que el objeto evento funcione en cualquier navegador. */

var Event = new Native({
	name: 'Event',
	initialize: function(event, win){
		win = win || window;
		var doc = win.document;
		event = event || win.event;
		if (event.$extended) return event;
		this.$extended = true;
		var type = event.type;
		var target = event.target || event.srcElement;
		while (target && target.nodeType == 3) target = target.parentNode;
		if (type.test(/key/)){
			var code = event.which || event.keyCode;
			var key = Event.Keys.keyOf(code);
			if (type == 'keydown'){
				var fKey = code - 111;
				if (fKey > 0 && fKey < 13) key = 'f' + fKey;
			}
			key = key || String.fromCharCode(code).toLowerCase();
		} else if (type.match(/(click|mouse|menu)/i)){
			doc = (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
			var page = {
				x: event.pageX || event.clientX + doc.scrollLeft,
				y: event.pageY || event.clientY + doc.scrollTop
			};
			var client = {
				x: (event.pageX) ? event.pageX - win.pageXOffset : event.clientX,
				y: (event.pageY) ? event.pageY - win.pageYOffset : event.clientY
			};
			if (type.match(/DOMMouseScroll|mousewheel/)){
				var wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
			}
			var rightClick = (event.which == 3) || (event.button == 2);
			var related = null;
			if (type.match(/over|out/)){
				switch (type){
					case 'mouseover': related = event.relatedTarget || event.fromElement; break;
					case 'mouseout': related = event.relatedTarget || event.toElement;
				}
				if (!(function(){
					while (related && related.nodeType == 3) related = related.parentNode;
					return true;
				}).create({attempt: Browser.Engine.gecko})()) related = false;
			}
		}
		return $extend(this, {
			event: event,
			type: type,
			page: page,
			client: client,
			rightClick: rightClick,
			wheel: wheel,
			relatedTarget: related,
			target: target,
			code: code,
			key: key,
			shift: event.shiftKey,
			control: event.ctrlKey,
			alt: event.altKey,
			meta: event.metaKey
		});
	}
});

Event.Keys = new Hash({
	'enter': 13,
	'up': 38,
	'down': 40,
	'left': 37,
	'right': 39,
	'esc': 27,
	'space': 32,
	'backspace': 8,
	'tab': 9,
	'delete': 46
});

Event.implement({
	stop: function(){
		return this.stopPropagation().preventDefault();
	},
	stopPropagation: function(){
		if (this.event.stopPropagation) this.event.stopPropagation();
		else this.event.cancelBubble = true;
		return this;
	},
	preventDefault: function(){
		if (this.event.preventDefault) this.event.preventDefault();
		else this.event.returnValue = false;
		return this;
	}
});

/* Contiene la funcion de la clase para que sea facil de crear, ampliar, y la implementacion de clases reutilizables. */

var Class = new Native({
	name: 'Class',
	initialize: function(properties){
		properties = properties || {};
		var klass = function(){
			for (var key in this){
				if ($type(this[key]) != 'function') this[key] = $unlink(this[key]);
			}
			this.constructor = klass;
			if (Class.prototyping) return this;
			var instance = (this.initialize) ? this.initialize.apply(this, arguments) : this;
			if (this.options && this.options.initialize) this.options.initialize.call(this);
			return instance;
		};
		for (var mutator in Class.Mutators){
			if (!properties[mutator]) continue;
			properties = Class.Mutators[mutator](properties, properties[mutator]);
			delete properties[mutator];
		}
		$extend(klass, this);
		klass.constructor = Class;
		klass.prototype = properties;
		return klass;
	}
});

Class.Mutators = {
	Extends: function(self, klass){
		Class.prototyping = klass.prototype;
		var subclass = new klass;
		delete subclass.parent;
		subclass = Class.inherit(subclass, self);
		delete Class.prototyping;
		return subclass;
	},
	Implements: function(self, klasses){
		$splat(klasses).each(function(klass){
			Class.prototying = klass;
			$extend(self, ($type(klass) == 'class') ? new klass : klass);
			delete Class.prototyping;
		});
		return self;
	}
};

Class.extend({
	inherit: function(object, properties){
		var caller = arguments.callee.caller;
		for (var key in properties){
			var override = properties[key];
			var previous = object[key];
			var type = $type(override);
			if (previous && type == 'function'){
				if (override != previous){
					if (caller){
						override.__parent = previous;
						object[key] = override;
					} else {
						Class.override(object, key, override);
					}
				}
			} else if(type == 'object'){
				object[key] = $merge(previous, override);
			} else {
				object[key] = override;
			}
		}
		if (caller) object.parent = function(){
			return arguments.callee.caller.__parent.apply(this, arguments);
		};
		return object;
	},
	override: function(object, name, method){
		var parent = Class.prototyping;
		if (parent && object[name] != parent[name]) parent = null;
		var override = function(){
			var previous = this.parent;
			this.parent = parent ? parent[name] : object[name];
			var value = method.apply(this, arguments);
			this.parent = previous;
			return value;
		};
		object[name] = override;
	}
});

Class.implement({
	implement: function(){
		var proto = this.prototype;
		$each(arguments, function(properties){
			Class.inherit(proto, properties);
		});
		return this;
	}
});

/* Contiene clases de utilidad que se pueden implementar en sus propias clases para facilitar la ejecucion de muchas tareas comunes. */

var Chain = new Class({
	$chain: [],
	chain: function(){
		this.$chain.extend(Array.flatten(arguments));
		return this;
	},
	callChain: function(){
		return (this.$chain.length) ? this.$chain.shift().apply(this, arguments) : false;
	},
	clearChain: function(){
		this.$chain.empty();
		return this;
	}
});

var Events = new Class({
	$events: {},
	addEvent: function(type, fn, internal){
		type = Events.removeOn(type);
		if (fn != $empty){
			this.$events[type] = this.$events[type] || [];
			this.$events[type].include(fn);
			if (internal) fn.internal = true;
		}
		return this;
	},
	addEvents: function(events){
		for (var type in events) this.addEvent(type, events[type]);
		return this;
	},
	fireEvent: function(type, args, delay){
		type = Events.removeOn(type);
		if (!this.$events || !this.$events[type]) return this;
		this.$events[type].each(function(fn){
			fn.create({'bind': this, 'delay': delay, 'arguments': args})();
		}, this);
		return this;
	},
	removeEvent: function(type, fn){
		type = Events.removeOn(type);
		if (!this.$events[type]) return this;
		if (!fn.internal) this.$events[type].erase(fn);
		return this;
	},
	removeEvents: function(events){
		if ($type(events) == 'object'){
			for (var type in events) this.removeEvent(type, events[type]);
			return this;
		}
		if (events) events = Events.removeOn(events);
		for (var type in this.$events){
			if (events && events != type) continue;
			var fns = this.$events[type];
			for (var i = fns.length; i--; i) this.removeEvent(type, fns[i]);
		}
		return this;
	}
});

Events.removeOn = function(string){
	return string.replace(/^on([A-Z])/, function(full, first) {
		return first.toLowerCase();
	});
};

var Options = new Class({
	setOptions: function(){
		this.options = $merge.run([this.options].extend(arguments));
		if (!this.addEvent) return this;
		for (var option in this.options){
			if ($type(this.options[option]) != 'function' || !(/^on[A-Z]/).test(option)) continue;
			this.addEvent(option, this.options[option]);
			delete this.options[option];
		}
		return this;
	}
});

/* Uno de los elementos mas importantes en MooTools. Contiene la funcion dolar, la funcion dolares, y un algunos cross-browser,
métodos de ahorro de tiempo que le permiten trabajar facilmente con los elementos HTML. */

var Element = new Native({
	name: 'Element',
	legacy: window.Element,
	initialize: function(tag, props){
		var konstructor = Element.Constructors.get(tag);
		if (konstructor) return konstructor(props);
		if (typeof tag == 'string') return document.newElement(tag, props);
		return $(tag).set(props);
	},
	afterImplement: function(key, value){
		Element.Prototype[key] = value;
		if (Array[key]) return;
		Elements.implement(key, function(){
			var items = [], elements = true;
			for (var i = 0, j = this.length; i < j; i++){
				var returns = this[i][key].apply(this[i], arguments);
				items.push(returns);
				if (elements) elements = ($type(returns) == 'element');
			}
			return (elements) ? new Elements(items) : items;
		});
	}
});

Element.Prototype = {$family: {name: 'element'}};

Element.Constructors = new Hash;

var IFrame = new Native({
	name: 'IFrame',
	generics: false,
	initialize: function(){
		var params = Array.link(arguments, {properties: Object.type, iframe: $defined});
		var props = params.properties || {};
		var iframe = $(params.iframe) || false;
		var onload = props.onload || $empty;
		delete props.onload;
		props.id = props.name = $pick(props.id, props.name, iframe.id, iframe.name, 'IFrame_' + $time());
		iframe = new Element(iframe || 'iframe', props);
		var onFrameLoad = function(){
			var host = $try(function(){
				return iframe.contentWindow.location.host;
			});
			if (host && host == window.location.host){
				var win = new Window(iframe.contentWindow);
				new Document(iframe.contentWindow.document);
				$extend(win.Element.prototype, Element.Prototype);
			}
			onload.call(iframe.contentWindow, iframe.contentWindow.document);
		};
		(window.frames[props.id]) ? onFrameLoad() : iframe.addListener('load', onFrameLoad);
		return iframe;
	}
});

var Elements = new Native({
	initialize: function(elements, options){
		options = $extend({ddup: true, cash: true}, options);
		elements = elements || [];
		if (options.ddup || options.cash){
			var uniques = {}, returned = [];
			for (var i = 0, l = elements.length; i < l; i++){
				var el = $.element(elements[i], !options.cash);
				if (options.ddup){
					if (uniques[el.uid]) continue;
					uniques[el.uid] = true;
				}
				returned.push(el);
			}
			elements = returned;
		}
		return (options.cash) ? $extend(elements, this) : elements;
	}
});

Elements.implement({
	filter: function(filter, bind){
		if (!filter) return this;
		return new Elements(Array.filter(this, (typeof filter == 'string') ? function(item){
			return item.match(filter);
		} : filter, bind));
	}
});

Document.implement({
	newElement: function(tag, props){
		if (Browser.Engine.trident && props){
			['name', 'type', 'checked'].each(function(attribute){
				if (!props[attribute]) return;
				tag += ' ' + attribute + '="' + props[attribute] + '"';
				if (attribute != 'checked') delete props[attribute];
			});
			tag = '<' + tag + '>';
		}
		return $.element(this.createElement(tag)).set(props);
	},
	newTextNode: function(text){
		return this.createTextNode(text);
	},
	getDocument: function(){
		return this;
	},
	getWindow: function(){
		return this.window;
	}
});

Window.implement({
	$: function(el, nocash){
		if (el && el.$family && el.uid) return el;
		var type = $type(el);
		return ($[type]) ? $[type](el, nocash, this.document) : null;
	},
	$$: function(selector){
		if (arguments.length == 1 && typeof selector == 'string') return this.document.getElements(selector);
		var elements = [];
		var args = Array.flatten(arguments);
		for (var i = 0, l = args.length; i < l; i++){
			var item = args[i];
			switch ($type(item)){
				case 'element': elements.push(item); break;
				case 'string': elements.extend(this.document.getElements(item, true));
			}
		}
		return new Elements(elements);
	},
	getDocument: function(){
		return this.document;
	},
	getWindow: function(){
		return this;
	}
});

$.string = function(id, nocash, doc){
	id = doc.getElementById(id);
	return (id) ? $.element(id, nocash) : null;
};

$.element = function(el, nocash){
	$uid(el);
	if (!nocash && !el.$family && !(/^object|embed$/i).test(el.tagName)){
		var proto = Element.Prototype;
		for (var p in proto) el[p] = proto[p];
	};
	return el;
};

$.object = function(obj, nocash, doc){
	if (obj.toElement) return $.element(obj.toElement(doc), nocash);
	return null;
};

$.textnode = $.whitespace = $.window = $.document = $arguments(0);

Native.implement([Element, Document], {
	getElement: function(selector, nocash){
		return $(this.getElements(selector, true)[0] || null, nocash);
	},
	getElements: function(tags, nocash){
		tags = tags.split(',');
		var elements = [];
		var ddup = (tags.length > 1);
		tags.each(function(tag){
			var partial = this.getElementsByTagName(tag.trim());
			(ddup) ? elements.extend(partial) : elements = partial;
		}, this);
		return new Elements(elements, {ddup: ddup, cash: !nocash});
	}
});

(function(){
var collected = {}, storage = {};
var props={input:'checked', option:'selected', textarea:(Browser.Engine.webkit&&Browser.Engine.version<420)?'innerHTML':'value'};
var get = function(uid){
	return (storage[uid] || (storage[uid] = {}));
};
var clean = function(item, retain){
	if (!item) return;
	var uid = item.uid;
	if (Browser.Engine.trident){
		if (item.clearAttributes){
			var clone = retain && item.cloneNode(false);
			item.clearAttributes();
			if (clone) item.mergeAttributes(clone);
		} else if (item.removeEvents){
			item.removeEvents();
		}
		if ((/object/i).test(item.tagName)){
			for (var p in item){
				if (typeof item[p] == 'function') item[p] = $empty;
			}
			Element.dispose(item);
		}
	}	
	if (!uid) return;
	collected[uid] = storage[uid] = null;
};

var purge = function(){
	Hash.each(collected, clean);
	if (Browser.Engine.trident) $A(document.getElementsByTagName('object')).each(clean);
	if (window.CollectGarbage) CollectGarbage();
	collected = storage = null;
};

var walk = function(element, walk, start, match, all, nocash){
	var el = element[start || walk];
	var elements = [];
	while (el){
		if (el.nodeType == 1 && (!match || Element.match(el, match))){
			if (!all) return $(el, nocash);
			elements.push(el);
		}
		el = el[walk];
	}
	return (all) ? new Elements(elements, {ddup: false, cash: !nocash}) : null;
};

var attributes = {
	'html': 'innerHTML',
	'class': 'className',
	'for': 'htmlFor',
	'text': (Browser.Engine.trident || (Browser.Engine.webkit && Browser.Engine.version < 420)) ? 'innerText' : 'textContent'
};
var bools = ['compact', 'nowrap', 'ismap', 'declare', 'noshade', 'checked', 'disabled', 'readonly', 'multiple', 'selected', 
	'noresize', 'defer'];
var camels = ['value', 'accessKey', 'cellPadding', 'cellSpacing', 'colSpan', 'frameBorder', 'maxLength', 'readOnly', 
	'rowSpan', 'tabIndex', 'useMap'];

Hash.extend(attributes, bools.associate(bools));
Hash.extend(attributes, camels.associate(camels.map(String.toLowerCase)));

var inserters = {
	before: function(context, element){
		if (element.parentNode) element.parentNode.insertBefore(context, element);
	},
	after: function(context, element){
		if (!element.parentNode) return;
		var next = element.nextSibling;
		(next) ? element.parentNode.insertBefore(context, next) : element.parentNode.appendChild(context);
	},
	bottom: function(context, element){
		element.appendChild(context);
	},
	top: function(context, element){
		var first = element.firstChild;
		(first) ? element.insertBefore(context, first) : element.appendChild(context);
	}
};

inserters.inside = inserters.bottom;

Hash.each(inserters, function(inserter, where){
	where = where.capitalize();
	Element.implement('inject' + where, function(el){
		inserter(this, $(el, true));
		return this;
	});
	Element.implement('grab' + where, function(el){
		inserter($(el, true), this);
		return this;
	});
});

Element.implement({
	set: function(prop, value){
		switch ($type(prop)){
			case 'object':
				for (var p in prop) this.set(p, prop[p]);
				break;
			case 'string':
				var property = Element.Properties.get(prop);
				(property && property.set) ? property.set.apply(this, Array.slice(arguments, 1)) : this.setProperty(prop, value);
		}
		return this;
	},
	get: function(prop){
		var property = Element.Properties.get(prop);
		return (property && property.get) ? property.get.apply(this, Array.slice(arguments, 1)) : this.getProperty(prop);
	},
	erase: function(prop){
		var property = Element.Properties.get(prop);
		(property && property.erase) ? property.erase.apply(this) : this.removeProperty(prop);
		return this;
	},
	setProperty: function(attribute, value){
		var key = attributes[attribute];
		if (value == undefined) return this.removeProperty(attribute);
		if (key && bools[attribute]) value = !!value;
		(key) ? this[key] = value : this.setAttribute(attribute, '' + value);
		return this;
	},
	setProperties: function(attributes){
		for (var attribute in attributes) this.setProperty(attribute, attributes[attribute]);
		return this;
	},
	getProperty: function(attribute){
		var key = attributes[attribute];
		var value = (key) ? this[key] : this.getAttribute(attribute, 2);
		return (bools[attribute]) ? !!value : (key) ? value : value || null;
	},
	getProperties: function(){
		var args = $A(arguments);
		return args.map(this.getProperty, this).associate(args);
	},
	removeProperty: function(attribute){
		var key = attributes[attribute];
		(key) ? this[key] = (key && bools[attribute]) ? false : '' : this.removeAttribute(attribute);
		return this;
	},
	removeProperties: function(){
		Array.each(arguments, this.removeProperty, this);
		return this;
	},
	hasClass: function(className){
		return this.className.contains(className, ' ');
	},
	addClass: function(className){
		if (!this.hasClass(className)) this.className = (this.className + ' ' + className).clean();
		return this;
	},
	removeClass: function(className){
		this.className = this.className.replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1');
		return this;
	},
	toggleClass: function(className){
		return this.hasClass(className) ? this.removeClass(className) : this.addClass(className);
	},
	adopt: function(){
		Array.flatten(arguments).each(function(element){
			element = $(element, true);
			if (element) this.appendChild(element);
		}, this);
		return this;
	},
	appendText: function(text, where){
		return this.grab(this.getDocument().newTextNode(text), where);
	},
	grab: function(el, where){
		inserters[where || 'bottom']($(el, true), this);
		return this;
	},
	inject: function(el, where){
		inserters[where || 'bottom'](this, $(el, true));
		return this;
	},
	replaces: function(el){
		el = $(el, true);
		el.parentNode.replaceChild(this, el);
		return this;
	},
	wraps: function(el, where){
		el = $(el, true);
		return this.replaces(el).grab(el, where);
	},
	getPrevious: function(match, nocash){
		return walk(this, 'previousSibling', null, match, false, nocash);
	},
	getAllPrevious: function(match, nocash){
		return walk(this, 'previousSibling', null, match, true, nocash);
	},
	getNext: function(match, nocash){
		return walk(this, 'nextSibling', null, match, false, nocash);
	},
	getAllNext: function(match, nocash){
		return walk(this, 'nextSibling', null, match, true, nocash);
	},
	getFirst: function(match, nocash){
		return walk(this, 'nextSibling', 'firstChild', match, false, nocash);
	},
	getLast: function(match, nocash){
		return walk(this, 'previousSibling', 'lastChild', match, false, nocash);
	},
	getParent: function(match, nocash){
		return walk(this, 'parentNode', null, match, false, nocash);
	},
	getParents: function(match, nocash){
		return walk(this, 'parentNode', null, match, true, nocash);
	},
	getChildren: function(match, nocash){
		return walk(this, 'nextSibling', 'firstChild', match, true, nocash);
	},
	getWindow: function(){
		return this.ownerDocument.window;
	},
	getDocument: function(){
		return this.ownerDocument;
	},
	getElementById: function(id, nocash){
		var el = this.ownerDocument.getElementById(id);
		if (!el) return null;
		for (var parent = el.parentNode; parent != this; parent = parent.parentNode){
			if (!parent) return null;
		}
		return $.element(el, nocash);
	},
	getSelected: function(){
		return new Elements($A(this.options).filter(function(option){
			return option.selected;
		}));
	},
	getComputedStyle: function(property){
		if (this.currentStyle) return this.currentStyle[property.camelCase()];
		var computed = this.getDocument().defaultView.getComputedStyle(this, null);
		return (computed) ? computed.getPropertyValue([property.hyphenate()]) : null;
	},
	toQueryString: function(){
		var queryString = [];
		this.getElements('input, select, textarea', true).each(function(el){
			if (!el.name || el.disabled) return;
			var value = (el.tagName.toLowerCase() == 'select') ? Element.getSelected(el).map(function(opt){
				return opt.value;
			}) : ((el.type == 'radio' || el.type == 'checkbox') && !el.checked) ? null : el.value;
			$splat(value).each(function(val){
				if (typeof val != 'undefined') queryString.push(el.name + '=' + encodeURIComponent(val));
			});
		});
		return queryString.join('&');
	},
	clone: function(contents, keepid){
		contents = contents !== false;
		var clone = this.cloneNode(contents);
		var clean = function(node, element){
			if (!keepid) node.removeAttribute('id');
			if (Browser.Engine.trident){
				node.clearAttributes();
				node.mergeAttributes(element);
				node.removeAttribute('uid');
				if (node.options){
					var no = node.options, eo = element.options;
					for (var j = no.length; j--;) no[j].selected = eo[j].selected;
				}
			}
			var prop = props[element.tagName.toLowerCase()];
			if (prop && element[prop]) node[prop] = element[prop];
		};
		if (contents){
			var ce = clone.getElementsByTagName('*'), te = this.getElementsByTagName('*');
			for (var i = ce.length; i--;) clean(ce[i], te[i]);
		}
		clean(clone, this);
		return $(clone);
	},
	destroy: function(){
		Element.empty(this);
		Element.dispose(this);
		clean(this, true);
		return null;
	},
	empty: function(){
		$A(this.childNodes).each(function(node){
			Element.destroy(node);
		});
		return this;
	},
	dispose: function(){
		return (this.parentNode) ? this.parentNode.removeChild(this) : this;
	},
	hasChild: function(el){
		el = $(el, true);
		if (!el) return false;
		if (Browser.Engine.webkit && Browser.Engine.version < 420) return $A(this.getElementsByTagName(el.tagName)).contains(el);
		return (this.contains) ? (this != el && this.contains(el)) : !!(this.compareDocumentPosition(el) & 16);
	},
	match: function(tag){
		return (!tag || (tag == this) || (Element.get(this, 'tag') == tag));
	}
});

Native.implement([Element, Window, Document], {
	addListener: function(type, fn){
		if (type == 'unload'){
			var old = fn, self = this;
			fn = function(){
				self.removeListener('unload', fn);
				old();
			};
		} else {
			collected[this.uid] = this;
		}
		if (this.addEventListener) this.addEventListener(type, fn, false);
		else this.attachEvent('on' + type, fn);
		return this;
	},
	removeListener: function(type, fn){
		if (this.removeEventListener) this.removeEventListener(type, fn, false);
		else this.detachEvent('on' + type, fn);
		return this;
	},
	retrieve: function(property, dflt){
		var storage = get(this.uid), prop = storage[property];
		if (dflt != undefined && prop == undefined) prop = storage[property] = dflt;
		return $pick(prop);
	},
	store: function(property, value){
		var storage = get(this.uid);
		storage[property] = value;
		return this;
	},
	eliminate: function(property){
		var storage = get(this.uid);
		delete storage[property];
		return this;
	}
});

window.addListener('unload', purge);
})();

Element.Properties = new Hash;

Element.Properties.style = {
	set: function(style){
		this.style.cssText = style;
	},
	get: function(){
		return this.style.cssText;
	},
	erase: function(){
		this.style.cssText = '';
	}
};

Element.Properties.tag = {
	get: function(){
		return this.tagName.toLowerCase();
	}
};

Element.Properties.html = (function(){
	var wrapper = document.createElement('div');
	var translations = {
		table: [1, '<table>', '</table>'],
		select: [1, '<select>', '</select>'],
		tbody: [2, '<table><tbody>', '</tbody></table>'],
		tr: [3, '<table><tbody><tr>', '</tr></tbody></table>']
	};
	translations.thead = translations.tfoot = translations.tbody;
	var html = {
		set: function(){
			var html = Array.flatten(arguments).join('');
			var wrap = Browser.Engine.trident && translations[this.get('tag')];
			if (wrap){
				var first = wrapper;
				first.innerHTML = wrap[1] + html + wrap[2];
				for (var i = wrap[0]; i--;) first = first.firstChild;
				this.empty().adopt(first.childNodes);
			} else {
				this.innerHTML = html;
			}
		}
	};
	html.erase = html.set;
	return html;
})();

if (Browser.Engine.webkit && Browser.Engine.version < 420) Element.Properties.text = {
	get: function(){
		if (this.innerText) return this.innerText;
		var temp = this.ownerDocument.newElement('div', {html: this.innerHTML}).inject(this.ownerDocument.body);
		var text = temp.innerText;
		temp.destroy();
		return text;
	}
};

/* Contiene metodos de elementos para hacer frente a acontecimientos y eventos personalizados. */

Element.Properties.events = {set: function(events){
	this.addEvents(events);
}};

Native.implement([Element, Window, Document], {
	addEvent: function(type, fn){
		var events = this.retrieve('events', {});
		events[type] = events[type] || {'keys': [], 'values': []};
		if (events[type].keys.contains(fn)) return this;
		events[type].keys.push(fn);
		var realType = type, custom = Element.Events.get(type), condition = fn, self = this;
		if (custom){
			if (custom.onAdd) custom.onAdd.call(this, fn);
			if (custom.condition){
				condition = function(event){
					if (custom.condition.call(this, event)) return fn.call(this, event);
					return true;
				};
			}
			realType = custom.base || realType;
		}
		var defn = function(){
			return fn.call(self);
		};
		var nativeEvent = Element.NativeEvents[realType];
		if (nativeEvent){
			if (nativeEvent == 2){
				defn = function(event){
					event = new Event(event, self.getWindow());
					if (condition.call(self, event) === false) event.stop();
				};
			}
			this.addListener(realType, defn);
		}
		events[type].values.push(defn);
		return this;
	},
	removeEvent: function(type, fn){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		var pos = events[type].keys.indexOf(fn);
		if (pos == -1) return this;
		events[type].keys.splice(pos, 1);
		var value = events[type].values.splice(pos, 1)[0];
		var custom = Element.Events.get(type);
		if (custom){
			if (custom.onRemove) custom.onRemove.call(this, fn);
			type = custom.base || type;
		}
		return (Element.NativeEvents[type]) ? this.removeListener(type, value) : this;
	},
	addEvents: function(events){
		for (var event in events) this.addEvent(event, events[event]);
		return this;
	},
	removeEvents: function(events){
		if ($type(events) == 'object'){
			for (var type in events) this.removeEvent(type, events[type]);
			return this;
		}
		var attached = this.retrieve('events');
		if (!attached) return this;
		if (!events){
			for (var type in attached) this.removeEvents(type);
			this.eliminate('events');
		} else if (attached[events]){
			while (attached[events].keys[0]) this.removeEvent(events, attached[events].keys[0]);
			attached[events] = null;
		}
		return this;
	},
	fireEvent: function(type, args, delay){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		events[type].keys.each(function(fn){
			fn.create({'bind': this, 'delay': delay, 'arguments': args})();
		}, this);
		return this;
	},
	cloneEvents: function(from, type){
		from = $(from);
		var fevents = from.retrieve('events');
		if (!fevents) return this;
		if (!type){
			for (var evType in fevents) this.cloneEvents(from, evType);
		} else if (fevents[type]){
			fevents[type].keys.each(function(fn){
				this.addEvent(type, fn);
			}, this);
		}
		return this;
	}
});

Element.NativeEvents = {
	click: 2, dblclick: 2, mouseup: 2, mousedown: 2, contextmenu: 2,
	mousewheel: 2, DOMMouseScroll: 2,
	mouseover: 2, mouseout: 2, mousemove: 2, selectstart: 2, selectend: 2,
	keydown: 2, keypress: 2, keyup: 2,
	focus: 2, blur: 2, change: 2, reset: 2, select: 2, submit: 2,
	load: 1, unload: 1, beforeunload: 2, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1,
	error: 1, abort: 1, scroll: 1
};

(function(){

var $check = function(event){
	var related = event.relatedTarget;
	if (related == undefined) return true;
	if (related === false) return false;
	return ($type(this) != 'document' && related != this && related.prefix != 'xul' && !this.hasChild(related));
};

Element.Events = new Hash({
	mouseenter: {
		base: 'mouseover',
		condition: $check
	},
	mouseleave: {
		base: 'mouseout',
		condition: $check
	},
	mousewheel: {
		base: (Browser.Engine.gecko) ? 'DOMMouseScroll' : 'mousewheel'
	}

});

})();

/* Contiene metodos para interactuar con los estilos de los elementos de una manera elegante. */

Element.Properties.styles = {set: function(styles){
	this.setStyles(styles);
}};

Element.Properties.opacity = {
	set: function(opacity, novisibility){
		if (!novisibility){
			if (opacity == 0){
				if (this.style.visibility != 'hidden') this.style.visibility = 'hidden';
			} else {
				if (this.style.visibility != 'visible') this.style.visibility = 'visible';
			}
		}
		if (!this.currentStyle || !this.currentStyle.hasLayout) this.style.zoom = 1;
		if (Browser.Engine.trident) this.style.filter = (opacity == 1) ? '' : 'alpha(opacity=' + opacity * 100 + ')';
		this.style.opacity = opacity;
		this.store('opacity', opacity);
	},
	get: function(){
		return this.retrieve('opacity', 1);
	}
};

Element.implement({
	setOpacity: function(value){
		return this.set('opacity', value, true);
	},
	getOpacity: function(){
		return this.get('opacity');
	},
	setStyle: function(property, value){
		switch (property){
			case 'opacity': return this.set('opacity', parseFloat(value));
			case 'float': property = (Browser.Engine.trident) ? 'styleFloat' : 'cssFloat';
		}
		property = property.camelCase();
		if ($type(value) != 'string'){
			var map = (Element.Styles.get(property) || '@').split(' ');
			value = $splat(value).map(function(val, i){
				if (!map[i]) return '';
				return ($type(val) == 'number') ? map[i].replace('@', Math.round(val)) : val;
			}).join(' ');
		} else if (value == String(Number(value))){
			value = Math.round(value);
		}
		this.style[property] = value;
		return this;
	},
	getStyle: function(property){
		switch (property){
			case 'opacity': return this.get('opacity');
			case 'float': property = (Browser.Engine.trident) ? 'styleFloat' : 'cssFloat';
		}
		property = property.camelCase();
		var result = this.style[property];
		if (!$chk(result)){
			result = [];
			for (var style in Element.ShortStyles){
				if (property != style) continue;
				for (var s in Element.ShortStyles[style]) result.push(this.getStyle(s));
				return result.join(' ');
			}
			result = this.getComputedStyle(property);
		}
		if (result){
			result = String(result);
			var color = result.match(/rgba?\([\d\s,]+\)/);
			if (color) result = result.replace(color[0], color[0].rgbToHex());
		}
		if (Browser.Engine.presto || (Browser.Engine.trident && !$chk(parseInt(result)))){
			if (property.test(/^(height|width)$/)){
				var values = (property == 'width') ? ['left', 'right'] : ['top', 'bottom'], size = 0;
				values.each(function(value){
					size += this.getStyle('border-' + value + '-width').toInt() + this.getStyle('padding-' + value).toInt();
				}, this);
				return this['offset' + property.capitalize()] - size + 'px';
			}
			if ((Browser.Engine.presto) && String(result).test('px')) return result;
			if (property.test(/(border(.+)Width|margin|padding)/)) return '0px';
		}
		return result;
	},
	setStyles: function(styles){
		for (var style in styles) this.setStyle(style, styles[style]);
		return this;
	},
	getStyles: function(){
		var result = {};
		Array.each(arguments, function(key){
			result[key] = this.getStyle(key);
		}, this);
		return result;
	}
});

Element.Styles = new Hash({
	left: '@px', top: '@px', bottom: '@px', right: '@px',
	width: '@px', height: '@px', maxWidth: '@px', maxHeight: '@px', minWidth: '@px', minHeight: '@px',
	backgroundColor: 'rgb(@, @, @)', backgroundPosition: '@px @px', color: 'rgb(@, @, @)',
	fontSize: '@px', letterSpacing: '@px', lineHeight: '@px', clip: 'rect(@px @px @px @px)',
	margin: '@px @px @px @px', padding: '@px @px @px @px', border: '@px @ rgb(@, @, @) @px @ rgb(@, @, @) @px @ rgb(@, @, @)',
	borderWidth: '@px @px @px @px', borderStyle: '@ @ @ @', borderColor: 'rgb(@, @, @) rgb(@, @, @) rgb(@, @, @) rgb(@, @, @)',
	zIndex: '@', 'zoom': '@', fontWeight: '@', textIndent: '@px', opacity: '@'
});

Element.ShortStyles = {margin: {}, padding: {}, border: {}, borderWidth: {}, borderStyle: {}, borderColor: {}};

['Top', 'Right', 'Bottom', 'Left'].each(function(direction){
	var Short = Element.ShortStyles;
	var All = Element.Styles;
	['margin', 'padding'].each(function(style){
		var sd = style + direction;
		Short[style][sd] = All[sd] = '@px';
	});
	var bd = 'border' + direction;
	Short.border[bd] = All[bd] = '@px @ rgb(@, @, @)';
	var bdw = bd + 'Width', bds = bd + 'Style', bdc = bd + 'Color';
	Short[bd] = {};
	Short.borderWidth[bdw] = Short[bd][bdw] = All[bdw] = '@px';
	Short.borderStyle[bds] = Short[bd][bds] = All[bds] = '@';
	Short.borderColor[bdc] = Short[bd][bdc] = All[bdc] = 'rgb(@, @, @)';
});

/* Contiene metodos para trabajar con las medidas, desplazamiento o el posicionamiento de los elementos y el objeto ventana. */

(function(){

Element.implement({
	scrollTo: function(x, y){
		if (isBody(this)){
			this.getWindow().scrollTo(x, y);
		} else {
			this.scrollLeft = x;
			this.scrollTop = y;
		}
		return this;
	},
	getSize: function(){
		if (isBody(this)) return this.getWindow().getSize();
		return {x: this.offsetWidth, y: this.offsetHeight};
	},
	getScrollSize: function(){
		if (isBody(this)) return this.getWindow().getScrollSize();
		return {x: this.scrollWidth, y: this.scrollHeight};
	},
	getScroll: function(){
		if (isBody(this)) return this.getWindow().getScroll();
		return {x: this.scrollLeft, y: this.scrollTop};
	},
	getScrolls: function(){
		var element = this, position = {x: 0, y: 0};
		while (element && !isBody(element)){
			position.x += element.scrollLeft;
			position.y += element.scrollTop;
			element = element.parentNode;
		}
		return position;
	},
	getOffsetParent: function(){
		var element = this;
		if (isBody(element)) return null;
		if (!Browser.Engine.trident) return element.offsetParent;
		while ((element = element.parentNode) && !isBody(element)){
			if (styleString(element, 'position') != 'static') return element;
		}
		return null;
	},
	getOffsets: function(){
		if (Browser.Engine.trident){
			var bound = this.getBoundingClientRect(), html = this.getDocument().documentElement;
			return {
				x: bound.left + html.scrollLeft - html.clientLeft,
				y: bound.top + html.scrollTop - html.clientTop
			};
		}
		var element = this, position = {x: 0, y: 0};
		if (isBody(this)) return position;
		while (element && !isBody(element)){
			position.x += element.offsetLeft;
			position.y += element.offsetTop;
			if (Browser.Engine.gecko){
				if (!borderBox(element)){
					position.x += leftBorder(element);
					position.y += topBorder(element);
				}
				var parent = element.parentNode;
				if (parent && styleString(parent, 'overflow') != 'visible'){
					position.x += leftBorder(parent);
					position.y += topBorder(parent);
				}
			} else if (element != this && Browser.Engine.webkit){
				position.x += leftBorder(element);
				position.y += topBorder(element);
			}
			element = element.offsetParent;
		}
		if (Browser.Engine.gecko && !borderBox(this)){
			position.x -= leftBorder(this);
			position.y -= topBorder(this);
		}
		return position;
	},
	getPosition: function(relative){
		if (isBody(this)) return {x: 0, y: 0};
		var offset = this.getOffsets(), scroll = this.getScrolls();
		var position = {x: offset.x - scroll.x, y: offset.y - scroll.y};
		var relativePosition = (relative && (relative = $(relative))) ? relative.getPosition() : {x: 0, y: 0};
		return {x: position.x - relativePosition.x, y: position.y - relativePosition.y};
	},
	getCoordinates: function(element){
		if (isBody(this)) return this.getWindow().getCoordinates();
		var position = this.getPosition(element), size = this.getSize();
		var obj = {left: position.x, top: position.y, width: size.x, height: size.y};
		obj.right = obj.left + obj.width;
		obj.bottom = obj.top + obj.height;
		return obj;
	},
	computePosition: function(obj){
		return {left: obj.x - styleNumber(this, 'margin-left'), top: obj.y - styleNumber(this, 'margin-top')};
	},
	position: function(obj){
		return this.setStyles(this.computePosition(obj));
	}
});

Native.implement([Document, Window], {
	getSize: function(){
		var win = this.getWindow();
		if (Browser.Engine.presto || Browser.Engine.webkit) return {x: win.innerWidth, y: win.innerHeight};
		var doc = getCompatElement(this);
		return {x: doc.clientWidth, y: doc.clientHeight};
	},
	getScroll: function(){
		var win = this.getWindow();
		var doc = getCompatElement(this);
		return {x: win.pageXOffset || doc.scrollLeft, y: win.pageYOffset || doc.scrollTop};
	},
	getScrollSize: function(){
		var doc = getCompatElement(this);
		var min = this.getSize();
		return {x: Math.max(doc.scrollWidth, min.x), y: Math.max(doc.scrollHeight, min.y)};
	},
	getPosition: function(){
		return {x: 0, y: 0};
	},
	getCoordinates: function(){
		var size = this.getSize();
		return {top: 0, left: 0, bottom: size.y, right: size.x, height: size.y, width: size.x};
	}
});

/* Metodos Privados */

var styleString = Element.getComputedStyle;

function styleNumber(element, style){
	return styleString(element, style).toInt() || 0;
};

function borderBox(element){
	return styleString(element, '-moz-box-sizing') == 'border-box';
};

function topBorder(element){
	return styleNumber(element, 'border-top-width');
};

function leftBorder(element){
	return styleNumber(element, 'border-left-width');
};

function isBody(element){
	return (/^(?:body|html)$/i).test(element.tagName);
};

function getCompatElement(element){
	var doc = element.getDocument();
	return (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
};

})();

/* Alias */

Native.implement([Window, Document, Element], {

	getHeight: function(){
		return this.getSize().y;
	},
	getWidth: function(){
		return this.getSize().x;
	},
	getScrollTop: function(){
		return this.getScroll().y;
	},
	getScrollLeft: function(){
		return this.getScroll().x;
	},
	getScrollHeight: function(){
		return this.getScrollSize().y;
	},
	getScrollWidth: function(){
		return this.getScrollSize().x;
	},
	getTop: function(){
		return this.getPosition().y;
	},
	getLeft: function(){
		return this.getPosition().x;
	}
});

/* Agrega capacidades de consulta CSS avanzados para dirigir elementos. También incluye soporte pseudo selectores. */

Native.implement([Document, Element], {
	getElements: function(expression, nocash){
		expression = expression.split(',');
		var items, local = {};
		for (var i = 0, l = expression.length; i < l; i++){
			var selector = expression[i], elements = Selectors.Utils.search(this, selector, local);
			if (i != 0 && elements.item) elements = $A(elements);
			items = (i == 0) ? elements : (items.item) ? $A(items).concat(elements) : items.concat(elements);
		}
		return new Elements(items, {ddup: (expression.length > 1), cash: !nocash});
	}
});

Element.implement({
	match: function(selector){
		if (!selector || (selector == this)) return true;
		var tagid = Selectors.Utils.parseTagAndID(selector);
		var tag = tagid[0], id = tagid[1];
		if (!Selectors.Filters.byID(this, id) || !Selectors.Filters.byTag(this, tag)) return false;
		var parsed = Selectors.Utils.parseSelector(selector);
		return (parsed) ? Selectors.Utils.filter(this, parsed, {}) : true;
	}
});

var Selectors = {Cache: {nth: {}, parsed: {}}};

Selectors.RegExps = {
	id: (/#([\w-]+)/),
	tag: (/^(\w+|\*)/),
	quick: (/^(\w+|\*)$/),
	splitter: (/\s*([+>~\s])\s*([a-zA-Z#.*:\[])/g),
	combined: (/\.([\w-]+)|\[(\w+)(?:([!*^$~|]?=)(["']?)([^\4]*?)\4)?\]|:([\w-]+)(?:\(["']?(.*?)?["']?\)|$)/g)
};

Selectors.Utils = {
	chk: function(item, uniques){
		if (!uniques) return true;
		var uid = $uid(item);
		if (!uniques[uid]) return uniques[uid] = true;
		return false;
	},
	parseNthArgument: function(argument){
		if (Selectors.Cache.nth[argument]) return Selectors.Cache.nth[argument];
		var parsed = argument.match(/^([+-]?\d*)?([a-z]+)?([+-]?\d*)?$/);
		if (!parsed) return false;
		var inta = parseInt(parsed[1]);
		var a = (inta || inta === 0) ? inta : 1;
		var special = parsed[2] || false;
		var b = parseInt(parsed[3]) || 0;
		if (a != 0){
			b--;
			while (b < 1) b += a;
			while (b >= a) b -= a;
		} else {
			a = b;
			special = 'index';
		}
		switch (special){
			case 'n': parsed = {a: a, b: b, special: 'n'}; break;
			case 'odd': parsed = {a: 2, b: 0, special: 'n'}; break;
			case 'even': parsed = {a: 2, b: 1, special: 'n'}; break;
			case 'first': parsed = {a: 0, special: 'index'}; break;
			case 'last': parsed = {special: 'last-child'}; break;
			case 'only': parsed = {special: 'only-child'}; break;
			default: parsed = {a: (a - 1), special: 'index'};
		}
		return Selectors.Cache.nth[argument] = parsed;
	},
	parseSelector: function(selector){
		if (Selectors.Cache.parsed[selector]) return Selectors.Cache.parsed[selector];
		var m, parsed = {classes: [], pseudos: [], attributes: []};
		while ((m = Selectors.RegExps.combined.exec(selector))){
			var cn = m[1], an = m[2], ao = m[3], av = m[5], pn = m[6], pa = m[7];
			if (cn){
				parsed.classes.push(cn);
			} else if (pn){
				var parser = Selectors.Pseudo.get(pn);
				if (parser) parsed.pseudos.push({parser: parser, argument: pa});
				else parsed.attributes.push({name: pn, operator: '=', value: pa});
			} else if (an){
				parsed.attributes.push({name: an, operator: ao, value: av});
			}
		}
		if (!parsed.classes.length) delete parsed.classes;
		if (!parsed.attributes.length) delete parsed.attributes;
		if (!parsed.pseudos.length) delete parsed.pseudos;
		if (!parsed.classes && !parsed.attributes && !parsed.pseudos) parsed = null;
		return Selectors.Cache.parsed[selector] = parsed;
	},
	parseTagAndID: function(selector){
		var tag = selector.match(Selectors.RegExps.tag);
		var id = selector.match(Selectors.RegExps.id);
		return [(tag) ? tag[1] : '*', (id) ? id[1] : false];
	},
	filter: function(item, parsed, local){
		var i;
		if (parsed.classes){
			for (i = parsed.classes.length; i--; i){
				var cn = parsed.classes[i];
				if (!Selectors.Filters.byClass(item, cn)) return false;
			}
		}
		if (parsed.attributes){
			for (i = parsed.attributes.length; i--; i){
				var att = parsed.attributes[i];
				if (!Selectors.Filters.byAttribute(item, att.name, att.operator, att.value)) return false;
			}
		}
		if (parsed.pseudos){
			for (i = parsed.pseudos.length; i--; i){
				var psd = parsed.pseudos[i];
				if (!Selectors.Filters.byPseudo(item, psd.parser, psd.argument, local)) return false;
			}
		}
		return true;
	},
	getByTagAndID: function(ctx, tag, id){
		if (id){
			var item = (ctx.getElementById) ? ctx.getElementById(id, true) : Element.getElementById(ctx, id, true);
			return (item && Selectors.Filters.byTag(item, tag)) ? [item] : [];
		} else {
			return ctx.getElementsByTagName(tag);
		}
	},
	search: function(self, expression, local){
		var splitters = [];
		var selectors = expression.trim().replace(Selectors.RegExps.splitter, function(m0, m1, m2){
			splitters.push(m1);
			return ':)' + m2;
		}).split(':)');
		var items, filtered, item;
		for (var i = 0, l = selectors.length; i < l; i++){
			var selector = selectors[i];
			if (i == 0 && Selectors.RegExps.quick.test(selector)){
				items = self.getElementsByTagName(selector);
				continue;
			}
			var splitter = splitters[i - 1];
			var tagid = Selectors.Utils.parseTagAndID(selector);
			var tag = tagid[0], id = tagid[1];
			if (i == 0){
				items = Selectors.Utils.getByTagAndID(self, tag, id);
			} else {
				var uniques = {}, found = [];
				for (var j = 0, k = items.length; j < k; j++) found = Selectors.Getters[splitter](found, items[j], tag, id, uniques);
				items = found;
			}
			var parsed = Selectors.Utils.parseSelector(selector);
			if (parsed){
				filtered = [];
				for (var m = 0, n = items.length; m < n; m++){
					item = items[m];
					if (Selectors.Utils.filter(item, parsed, local)) filtered.push(item);
				}
				items = filtered;
			}
		}
		return items;
	}
};

Selectors.Getters = {
	' ': function(found, self, tag, id, uniques){
		var items = Selectors.Utils.getByTagAndID(self, tag, id);
		for (var i = 0, l = items.length; i < l; i++){
			var item = items[i];
			if (Selectors.Utils.chk(item, uniques)) found.push(item);
		}
		return found;
	},
	'>': function(found, self, tag, id, uniques){
		var children = Selectors.Utils.getByTagAndID(self, tag, id);
		for (var i = 0, l = children.length; i < l; i++){
			var child = children[i];
			if (child.parentNode == self && Selectors.Utils.chk(child, uniques)) found.push(child);
		}
		return found;
	},
	'+': function(found, self, tag, id, uniques){
		while ((self = self.nextSibling)){
			if (self.nodeType == 1){
				if (Selectors.Utils.chk(self, uniques) && Selectors.Filters.byTag(self, tag) && 
					Selectors.Filters.byID(self, id)) found.push(self);
				break;
			}
		}
		return found;
	},

	'~': function(found, self, tag, id, uniques){
		while ((self = self.nextSibling)){
			if (self.nodeType == 1){
				if (!Selectors.Utils.chk(self, uniques)) break;
				if (Selectors.Filters.byTag(self, tag) && Selectors.Filters.byID(self, id)) found.push(self);
			}
		}
		return found;
	}

};

Selectors.Filters = {
	byTag: function(self, tag){
		return (tag == '*' || (self.tagName && self.tagName.toLowerCase() == tag));
	},
	byID: function(self, id){
		return (!id || (self.id && self.id == id));
	},
	byClass: function(self, klass){
		return (self.className && self.className.contains(klass, ' '));
	},
	byPseudo: function(self, parser, argument, local){
		return parser.call(self, argument, local);
	},
	byAttribute: function(self, name, operator, value){
		var result = Element.prototype.getProperty.call(self, name);
		if (!result) return (operator == '!=');
		if (!operator || value == undefined) return true;
		switch (operator){
			case '=': return (result == value);
			case '*=': return (result.contains(value));
			case '^=': return (result.substr(0, value.length) == value);
			case '$=': return (result.substr(result.length - value.length) == value);
			case '!=': return (result != value);
			case '~=': return result.contains(value, ' ');
			case '|=': return result.contains(value, '-');
		}
		return false;
	}
};

/* Pseudo Selectores */

Selectors.Pseudo = new Hash({
	checked: function(){
		return this.checked;
	},
	empty: function(){
		return !(this.innerText || this.textContent || '').length;
	},
	not: function(selector){
		return !Element.match(this, selector);
	},
	contains: function(text){
		return (this.innerText || this.textContent || '').contains(text);
	},
	'first-child': function(){
		return Selectors.Pseudo.index.call(this, 0);
	},
	'last-child': function(){
		var element = this;
		while ((element = element.nextSibling)){
			if (element.nodeType == 1) return false;
		}
		return true;
	},
	'only-child': function(){
		var prev = this;
		while ((prev = prev.previousSibling)){
			if (prev.nodeType == 1) return false;
		}
		var next = this;
		while ((next = next.nextSibling)){
			if (next.nodeType == 1) return false;
		}
		return true;
	},
	'nth-child': function(argument, local){
		argument = (argument == undefined) ? 'n' : argument;
		var parsed = Selectors.Utils.parseNthArgument(argument);
		if (parsed.special != 'n') return Selectors.Pseudo[parsed.special].call(this, parsed.a, local);
		var count = 0;
		local.positions = local.positions || {};
		var uid = $uid(this);
		if (!local.positions[uid]){
			var self = this;
			while ((self = self.previousSibling)){
				if (self.nodeType != 1) continue;
				count ++;
				var position = local.positions[$uid(self)];
				if (position != undefined){
					count = position + count;
					break;
				}
			}
			local.positions[uid] = count;
		}
		return (local.positions[uid] % parsed.a == parsed.b);
	},
	index: function(index){
		var element = this, count = 0;
		while ((element = element.previousSibling)){
			if (element.nodeType == 1 && ++count > index) return false;
		}
		return (count == index);
	},
	even: function(argument, local){
		return Selectors.Pseudo['nth-child'].call(this, '2n+1', local);
	},
	odd: function(argument, local){
		return Selectors.Pseudo['nth-child'].call(this, '2n', local);
	}
});

/* Contiene el evento personalizado domready. */

Element.Events.domready = {
	onAdd: function(fn){
		if (Browser.loaded) fn.call(this);
	}
};

(function(){
	var domready = function(){
		if (Browser.loaded) return;
		Browser.loaded = true;
		window.fireEvent('domready');
		document.fireEvent('domready');
	};

	if (Browser.Engine.trident){
		var temp = document.createElement('div');
		(function(){
			($try(function(){
				temp.doScroll('left');
				return $(temp).inject(document.body).set('html', 'temp').dispose();
			})) ? domready() : arguments.callee.delay(50);
		})();
	} else if (Browser.Engine.webkit && Browser.Engine.version < 525){
		(function(){
			(['loaded', 'complete'].contains(document.readyState)) ? domready() : arguments.callee.delay(50);
		})();
	} else {
		window.addEvent('load', domready);
		document.addEvent('DOMContentLoaded', domready);
	}
})();

/* Clase para crear, cargar y guardar las cookies del navegador. */

var Cookie = new Class({
	Implements: Options,
	options: {
		path: false,
		domain: false,
		duration: false,
		secure: false,
		document: document
	},
	initialize: function(key, options){
		this.key = key;
		this.setOptions(options);
	},
	write: function(value){
		value = encodeURIComponent(value);
		if (this.options.domain) value += '; domain=' + this.options.domain;
		if (this.options.path) value += '; path=' + this.options.path;
		if (this.options.duration){
			var date = new Date();
			date.setTime(date.getTime() + this.options.duration * 24 * 60 * 60 * 1000);
			value += '; expires=' + date.toGMTString();
		}
		if (this.options.secure) value += '; secure';
		this.options.document.cookie = this.key + '=' + value;
		return this;
	},
	read: function(){
		var value = this.options.document.cookie.match('(?:^|;)\\s*' + this.key.escapeRegExp() + '=([^;]*)');
		return (value) ? decodeURIComponent(value[1]) : null;
	},
	dispose: function(){
		new Cookie(this.key, $merge(this.options, {duration: -1})).write('');
		return this;
	}
});

Cookie.write = function(key, value, options){
	return new Cookie(key, options).write(value);
};

Cookie.read = function(key){
	return new Cookie(key).read();
};

Cookie.dispose = function(key, options){
	return new Cookie(key, options).dispose();
};

/* Envoltura para incrustar peliculas SWF. Apoyos (y correcciones) Comunicacion Interfaz externo. */

var Swiff = new Class({
	Implements: [Options],
	options: {
		id: null,
		height: 1,
		width: 1,
		container: null,
		properties: {},
		params: {
			quality: 'high',
			allowScriptAccess: 'always',
			wMode: 'transparent',
			swLiveConnect: true
		},
		callBacks: {},
		vars: {}
	},
	toElement: function(){
		return this.object;
	},
	initialize: function(path, options){
		this.instance = 'Swiff_' + $time();
		this.setOptions(options);
		options = this.options;
		var id = this.id = options.id || this.instance;
		var container = $(options.container);
		Swiff.CallBacks[this.instance] = {};
		var params = options.params, vars = options.vars, callBacks = options.callBacks;
		var properties = $extend({height: options.height, width: options.width}, options.properties);
		var self = this;
		for (var callBack in callBacks){
			Swiff.CallBacks[this.instance][callBack] = (function(option){
				return function(){
					return option.apply(self.object, arguments);
				};
			})(callBacks[callBack]);
			vars[callBack] = 'Swiff.CallBacks.' + this.instance + '.' + callBack;
		}
		params.flashVars = Hash.toQueryString(vars);
		if (Browser.Engine.trident){
			properties.classid = 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000';
			params.movie = path;
		} else {
			properties.type = 'application/x-shockwave-flash';
			properties.data = path;
		}
		var build = '<object id="' + id + '"';
		for (var property in properties) build += ' ' + property + '="' + properties[property] + '"';
		build += '>';
		for (var param in params){
			if (params[param]) build += '<param name="' + param + '" value="' + params[param] + '" />';
		}
		build += '</object>';
		this.object = ((container) ? container.empty() : new Element('div')).set('html', build).firstChild;
	},
	replaces: function(element){
		element = $(element, true);
		element.parentNode.replaceChild(this.toElement(), element);
		return this;
	},
	inject: function(element){
		$(element, true).appendChild(this.toElement());
		return this;
	},
	remote: function(){
		return Swiff.remote.apply(Swiff, [this.toElement()].extend(arguments));
	}
});

Swiff.CallBacks = {};

Swiff.remote = function(obj, fn){
	var rs = obj.CallFunction('<invoke name="' + fn + '" returntype="javascript">' + __flash__argumentsToXML(arguments, 2) 
		+ '</invoke>');
	return eval(rs);
};

/* Contiene la logica basica de animacion que se extienda por todas las demas clases Fx. */

var Fx = new Class({

	Implements: [Chain, Events, Options],

	options: {
		fps: 50,
		unit: false,
		duration: 500,
		link: 'ignore'
	},
	initialize: function(options){
		this.subject = this.subject || this;
		this.setOptions(options);
		this.options.duration = Fx.Durations[this.options.duration] || this.options.duration.toInt();
		var wait = this.options.wait;
		if (wait === false) this.options.link = 'cancel';
	},
	getTransition: function(){
		return function(p){
			return -(Math.cos(Math.PI * p) - 1) / 2;
		};
	},
	step: function(){
		var time = $time();
		if (time < this.time + this.options.duration){
			var delta = this.transition((time - this.time) / this.options.duration);
			this.set(this.compute(this.from, this.to, delta));
		} else {
			this.set(this.compute(this.from, this.to, 1));
			this.complete();
		}
	},
	set: function(now){
		return now;
	},
	compute: function(from, to, delta){
		return Fx.compute(from, to, delta);
	},
	check: function(caller){
		if (!this.timer) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(caller.bind(this, Array.slice(arguments, 1))); return false;
		}
		return false;
	},
	start: function(from, to){
		if (!this.check(arguments.callee, from, to)) return this;
		this.from = from;
		this.to = to;
		this.time = 0;
		this.transition = this.getTransition();
		this.startTimer();
		this.onStart();
		return this;
	},
	complete: function(){
		if (this.stopTimer()) this.onComplete();
		return this;
	},
	cancel: function(){
		if (this.stopTimer()) this.onCancel();
		return this;
	},

	onStart: function(){
		this.fireEvent('start', this.subject);
	},
	onComplete: function(){
		this.fireEvent('complete', this.subject);
		if (!this.callChain()) this.fireEvent('chainComplete', this.subject);
	},
	onCancel: function(){
		this.fireEvent('cancel', this.subject).clearChain();
	},
	pause: function(){
		this.stopTimer();
		return this;
	},
	resume: function(){
		this.startTimer();
		return this;
	},
	stopTimer: function(){
		if (!this.timer) return false;
		this.time = $time() - this.time;
		this.timer = $clear(this.timer);
		return true;
	},
	startTimer: function(){
		if (this.timer) return false;
		this.time = $time() - this.time;
		this.timer = this.step.periodical(Math.round(1000 / this.options.fps), this);
		return true;
	}
});

Fx.compute = function(from, to, delta){
	return (to - from) * delta + from;
};

Fx.Durations = {'short': 250, 'normal': 500, 'long': 1000};

/* Contiene la logica animacion CSS. Utilizado por Fx.Tween, Fx.Morph, Fx.Elements. */

Fx.CSS = new Class({
	Extends: Fx,
	prepare: function(element, property, values){
		values = $splat(values);
		var values1 = values[1];
		if (!$chk(values1)){
			values[1] = values[0];
			values[0] = element.getStyle(property);
		}
		var parsed = values.map(this.parse);
		return {from: parsed[0], to: parsed[1]};
	},
	parse: function(value){
		value = $lambda(value)();
		value = (typeof value == 'string') ? value.split(' ') : $splat(value);
		return value.map(function(val){
			val = String(val);
			var found = false;
			Fx.CSS.Parsers.each(function(parser, key){
				if (found) return;
				var parsed = parser.parse(val);
				if ($chk(parsed)) found = {value: parsed, parser: parser};
			});
			found = found || {value: val, parser: Fx.CSS.Parsers.String};
			return found;
		});
	},
	compute: function(from, to, delta){
		var computed = [];
		(Math.min(from.length, to.length)).times(function(i){
			computed.push({value: from[i].parser.compute(from[i].value, to[i].value, delta), parser: from[i].parser});
		});
		computed.$family = {name: 'fx:css:value'};
		return computed;
	},
	serve: function(value, unit){
		if ($type(value) != 'fx:css:value') value = this.parse(value);
		var returned = [];
		value.each(function(bit){
			returned = returned.concat(bit.parser.serve(bit.value, unit));
		});
		return returned;
	},
	render: function(element, property, value, unit){
		element.setStyle(property, this.serve(value, unit));
	},
	search: function(selector){
		if (Fx.CSS.Cache[selector]) return Fx.CSS.Cache[selector];
		var to = {};
		Array.each(document.styleSheets, function(sheet, j){
			var href = sheet.href;
			if (href && href.contains('://') && !href.contains(document.domain)) return;
			var rules = sheet.rules || sheet.cssRules;
			Array.each(rules, function(rule, i){
				if (!rule.style) return;
				var selectorText = (rule.selectorText) ? rule.selectorText.replace(/^\w+/, function(m){
					return m.toLowerCase();
				}) : null;
				if (!selectorText || !selectorText.test('^' + selector + '$')) return;
				Element.Styles.each(function(value, style){
					if (!rule.style[style] || Element.ShortStyles[style]) return;
					value = String(rule.style[style]);
					to[style] = (value.test(/^rgb/)) ? value.rgbToHex() : value;
				});
			});
		});
		return Fx.CSS.Cache[selector] = to;
	}
});

Fx.CSS.Cache = {};

Fx.CSS.Parsers = new Hash({
	Color: {
		parse: function(value){
			if (value.match(/^#[0-9a-f]{3,6}$/i)) return value.hexToRgb(true);
			return ((value = value.match(/(\d+),\s*(\d+),\s*(\d+)/))) ? [value[1], value[2], value[3]] : false;
		},
		compute: function(from, to, delta){
			return from.map(function(value, i){
				return Math.round(Fx.compute(from[i], to[i], delta));
			});
		},
		serve: function(value){
			return value.map(Number);
		}
	},
	Number: {
		parse: parseFloat,
		compute: Fx.compute,
		serve: function(value, unit){
			return (unit) ? value + unit : value;
		}
	},
	String: {
		parse: $lambda(false),
		compute: $arguments(1),
		serve: $arguments(0)
	}
});

/* Efecto de transicion de cualquier propiedad CSS de un elemento. */

Fx.Tween = new Class({
	Extends: Fx.CSS,
	initialize: function(element, options){
		this.element = this.subject = $(element);
		this.parent(options);
	},
	set: function(property, now){
		if (arguments.length == 1){
			now = property;
			property = this.property || this.options.property;
		}
		this.render(this.element, property, now, this.options.unit);
		return this;
	},
	start: function(property, from, to){
		if (!this.check(arguments.callee, property, from, to)) return this;
		var args = Array.flatten(arguments);
		this.property = this.options.property || args.shift();
		var parsed = this.prepare(this.element, this.property, args);
		return this.parent(parsed.from, parsed.to);
	}
});

Element.Properties.tween = {
	set: function(options){
		var tween = this.retrieve('tween');
		if (tween) tween.cancel();
		return this.eliminate('tween').store('tween:options', $extend({link: 'cancel'}, options));
	},
	get: function(options){
		if (options || !this.retrieve('tween')){
			if (options || !this.retrieve('tween:options')) this.set('tween', options);
			this.store('tween', new Fx.Tween(this, this.retrieve('tween:options')));
		}
		return this.retrieve('tween');
	}
};

Element.implement({
	tween: function(property, from, to){
		this.get('tween').start(arguments);
		return this;
	},
	fade: function(how){
		var fade = this.get('tween'), o = 'opacity', toggle;
		how = $pick(how, 'toggle');
		switch (how){
			case 'in': fade.start(o, 1); break;
			case 'out': fade.start(o, 0); break;
			case 'show': fade.set(o, 1); break;
			case 'hide': fade.set(o, 0); break;
			case 'toggle':
				var flag = this.retrieve('fade:flag', this.get('opacity') == 1);
				fade.start(o, (flag) ? 0 : 1);
				this.store('fade:flag', !flag);
				toggle = true;
			break;
			default: fade.start(o, arguments);
		}
		if (!toggle) this.eliminate('fade:flag');
		return this;
	},
	highlight: function(start, end){
		if (!end){
			end = this.retrieve('highlight:original', this.getStyle('background-color'));
			end = (end == 'transparent') ? '#fff' : end;
		}
		var tween = this.get('tween');
		tween.start('background-color', start || '#ffff88', end).chain(function(){
			this.setStyle('background-color', this.retrieve('highlight:original'));
			tween.callChain();
		}.bind(this));
		return this;
	}
});

/* Efectuar la transicion de cualquier numero de propiedades CSS para un elemento utilizando un objeto de normas o reglas de selector CSS basado. */

Fx.Morph = new Class({
	Extends: Fx.CSS,
	initialize: function(element, options){
		this.element = this.subject = $(element);
		this.parent(options);
	},
	set: function(now){
		if (typeof now == 'string') now = this.search(now);
		for (var p in now) this.render(this.element, p, now[p], this.options.unit);
		return this;
	},
	compute: function(from, to, delta){
		var now = {};
		for (var p in from) now[p] = this.parent(from[p], to[p], delta);
		return now;
	},
	start: function(properties){
		if (!this.check(arguments.callee, properties)) return this;
		if (typeof properties == 'string') properties = this.search(properties);
		var from = {}, to = {};
		for (var p in properties){
			var parsed = this.prepare(this.element, p, properties[p]);
			from[p] = parsed.from;
			to[p] = parsed.to;
		}
		return this.parent(from, to);
	}
});

Element.Properties.morph = {
	set: function(options){
		var morph = this.retrieve('morph');
		if (morph) morph.cancel();
		return this.eliminate('morph').store('morph:options', $extend({link: 'cancel'}, options));
	},
	get: function(options){
		if (options || !this.retrieve('morph')){
			if (options || !this.retrieve('morph:options')) this.set('morph', options);
			this.store('morph', new Fx.Morph(this, this.retrieve('morph:options')));
		}
		return this.retrieve('morph');
	}
};

Element.implement({
	morph: function(props){
		this.get('morph').start(props);
		return this;
	}
});

/* Contiene un conjunto de transiciones avanzadas para ser utilizados con cualquiera de las Series Fx. */

Fx.implement({
	getTransition: function(){
		var trans = this.options.transition || Fx.Transitions.Sine.easeInOut;
		if (typeof trans == 'string'){
			var data = trans.split(':');
			trans = Fx.Transitions;
			trans = trans[data[0]] || trans[data[0].capitalize()];
			if (data[1]) trans = trans['ease' + data[1].capitalize() + (data[2] ? data[2].capitalize() : '')];
		}
		return trans;
	}
});

Fx.Transition = function(transition, params){
	params = $splat(params);
	return $extend(transition, {
		easeIn: function(pos){
			return transition(pos, params);
		},
		easeOut: function(pos){
			return 1 - transition(1 - pos, params);
		},
		easeInOut: function(pos){
			return (pos <= 0.5) ? transition(2 * pos, params) / 2 : (2 - transition(2 * (1 - pos), params)) / 2;
		}
	});
};

Fx.Transitions = new Hash({
	linear: $arguments(0)
});

Fx.Transitions.extend = function(transitions){
	for (var transition in transitions) Fx.Transitions[transition] = new Fx.Transition(transitions[transition]);
};

Fx.Transitions.extend({
	Pow: function(p, x){
		return Math.pow(p, x[0] || 6);
	},
	Expo: function(p){
		return Math.pow(2, 8 * (p - 1));
	},
	Circ: function(p){
		return 1 - Math.sin(Math.acos(p));
	},
	Sine: function(p){
		return 1 - Math.sin((1 - p) * Math.PI / 2);
	},
	Back: function(p, x){
		x = x[0] || 1.618;
		return Math.pow(p, 2) * ((x + 1) * p - x);
	},
	Bounce: function(p){
		var value;
		for (var a = 0, b = 1; 1; a += b, b /= 2){
			if (p >= (7 - 4 * a) / 11){
				value = b * b - Math.pow((11 - 6 * a - 11 * p) / 4, 2);
				break;
			}
		}
		return value;
	},
	Elastic: function(p, x){
		return Math.pow(2, 10 * --p) * Math.cos(20 * p * Math.PI * (x[0] || 1) / 3);
	}
});

['Quad', 'Cubic', 'Quart', 'Quint'].each(function(transition, i){
	Fx.Transitions[transition] = new Fx.Transition(function(p){
		return Math.pow(p, [i + 2]);
	});
});

/* Solicitud de clase. Utiliza XMLHTTPRequest. */

var Request = new Class({
	Implements: [Chain, Events, Options],
	options: {
		url: '',
		data: '',
		headers: {
			'X-Requested-With': 'XMLHttpRequest',
			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
		},
		async: true,
		format: false,
		method: 'post',
		link: 'ignore',
		isSuccess: null,
		emulation: true,
		urlEncoded: true,
		encoding: 'utf-8',
		evalScripts: false,
		evalResponse: false
	},
	initialize: function(options){
		this.xhr = new Browser.Request();
		this.setOptions(options);
		this.options.isSuccess = this.options.isSuccess || this.isSuccess;
		this.headers = new Hash(this.options.headers);
	},
	onStateChange: function(){
		if (this.xhr.readyState != 4 || !this.running) return;
		this.running = false;
		this.status = 0;
		$try(function(){
			this.status = this.xhr.status;
		}.bind(this));
		if (this.options.isSuccess.call(this, this.status)){
			this.response = {text: this.xhr.responseText, xml: this.xhr.responseXML};
			this.success(this.response.text, this.response.xml);
		} else {
			this.response = {text: null, xml: null};
			this.failure();
		}
		this.xhr.onreadystatechange = $empty;
	},
	isSuccess: function(){
		return ((this.status >= 200) && (this.status < 300));
	},
	processScripts: function(text){
		if (this.options.evalResponse || (/(ecma|java)script/).test(this.getHeader('Content-type'))) return $exec(text);
		return text.stripScripts(this.options.evalScripts);
	},
	success: function(text, xml){
		this.onSuccess(this.processScripts(text), xml);
	},
	onSuccess: function(){
		this.fireEvent('complete', arguments).fireEvent('success', arguments).callChain();
	},
	failure: function(){
		this.onFailure();
	},
	onFailure: function(){
		this.fireEvent('complete').fireEvent('failure', this.xhr);
	},
	setHeader: function(name, value){
		this.headers.set(name, value);
		return this;
	},
	getHeader: function(name){
		return $try(function(){
			return this.xhr.getResponseHeader(name);
		}.bind(this));
	},
	check: function(caller){
		if (!this.running) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(caller.bind(this, Array.slice(arguments, 1))); return false;
		}
		return false;
	},
	send: function(options){
		if (!this.check(arguments.callee, options)) return this;
		this.running = true;
		var type = $type(options);
		if (type == 'string' || type == 'element') options = {data: options};
		var old = this.options;
		options = $extend({data: old.data, url: old.url, method: old.method}, options);
		var data = options.data, url = options.url, method = options.method;
		switch ($type(data)){
			case 'element': data = $(data).toQueryString(); break;
			case 'object': case 'hash': data = Hash.toQueryString(data);
		}
		if (this.options.format){
			var format = 'format=' + this.options.format;
			data = (data) ? format + '&' + data : format;
		}
		if (this.options.emulation && ['put', 'delete'].contains(method)){
			var _method = '_method=' + method;
			data = (data) ? _method + '&' + data : _method;
			method = 'post';
		}
		if (this.options.urlEncoded && method == 'post'){
			var encoding = (this.options.encoding) ? '; charset=' + this.options.encoding : '';
			this.headers.set('Content-type', 'application/x-www-form-urlencoded' + encoding);
		}
		if (data && method == 'get'){
			url = url + (url.contains('?') ? '&' : '?') + data;
			data = null;
		}
		this.xhr.open(method.toUpperCase(), url, this.options.async);
		this.xhr.onreadystatechange = this.onStateChange.bind(this);
		this.headers.each(function(value, key){
			try {
				this.xhr.setRequestHeader(key, value);
			} catch (e){
				this.fireEvent('exception', [key, value]);
			}
		}, this);
		this.fireEvent('request');
		this.xhr.send(data);
		if (!this.options.async) this.onStateChange();
		return this;
	},
	cancel: function(){
		if (!this.running) return this;
		this.running = false;
		this.xhr.abort();
		this.xhr.onreadystatechange = $empty;
		this.xhr = new Browser.Request();
		this.fireEvent('cancel');
		return this;
	}
});

(function(){

var methods = {};
['get', 'post', 'put', 'delete', 'GET', 'POST', 'PUT', 'DELETE'].each(function(method){
	methods[method] = function(){
		var params = Array.link(arguments, {url: String.type, data: $defined});
		return this.send($extend(params, {method: method.toLowerCase()}));
	};
});

Request.implement(methods);

})();

Element.Properties.send = {
	set: function(options){
		var send = this.retrieve('send');
		if (send) send.cancel();
		return this.eliminate('send').store('send:options', $extend({
			data: this, link: 'cancel', method: this.get('method') || 'post', url: this.get('action')
		}, options));
	},
	get: function(options){
		if (options || !this.retrieve('send')){
			if (options || !this.retrieve('send:options')) this.set('send', options);
			this.store('send', new Request(this.retrieve('send:options')));
		}
		return this.retrieve('send');
	}
};

Element.implement({
	send: function(url){
		var sender = this.get('send');
		sender.send({data: this, url: url || sender.options.url});
		return this;
	}
});

/*****************************************
*********** Codigo del Juego *************
**** La Implementacion del codigo se *****
*** hace sobre las clases de MooTools ***
*****************************************/

var game={};
game.debug=0;

/* Clase Objeto del Juego. */

var ObjetoJuego=new Class({
	initialize:function(){
		this.x=0;
		this.y=0;
		this.z=0;
		this.HTMLIncarnation=null;
		this.world=null;
		this.type=null;
	},
	comeIntoExistence:function(world){
		this.HTMLIncarnation.injectInside(world.HTMLIncarnation);
		this.world=world;
}});

/* Clase del mundo. Genera el mundo del juego. */

var World=new Class({
	Extends:ObjetoJuego,
	initialize:function(width,height){
		this.parent();
		this.HTMLIncarnation=new Element('div',{'class':'Mundo'});
		this.width=width;
		this.height=height;
		this.type='Mundo';
		this.worldWindow={width:0,height:0};
		this.scrollStep=2*game.standardWidth;
		this.viewport=$('GameView');
		this.verticalMove=new Fx.Tween(this.HTMLIncarnation,{duration:300});
		this.horizontalMove=new Fx.Tween(this.HTMLIncarnation,{duration:300});
	},
	start:function(){
		this.scrollOffset=0;
		this.HTMLIncarnation.injectInside(this.viewport);
		this.worldWindow.width=parseInt(this.viewport.getStyle('width'));
		this.worldWindow.height=parseInt(this.viewport.getStyle('height'));
		this.HTMLIncarnation.setStyle('width',this.width);
		this.HTMLIncarnation.setStyle('height',this.height);
	},
	changeWorldParameters:function(width,height){
		this.width=width;
		this.height=height;
		this.HTMLIncarnation.setStyle('width',this.width);
		this.HTMLIncarnation.setStyle('height',this.height);
	},
	moveLeft:function(){
		var step=this.scrollStep;
		if(this.x-step+game.worldWidth<=this.worldWindow.width)
			step=this.x+game.worldWidth-this.worldWindow.width;
		if(step>0){
			this.horizontalMove.start('left',this.x,this.x-step);
			this.x=this.x-step;
		}
	},
	moveRight:function(){
		var step=this.scrollStep;
		if(this.x+step>0)
			step=(-1)*this.x;
		if(step>0){
			this.horizontalMove.start('left',this.x,this.x+step);
			this.x=this.x+step;
		}
	},
	moveUp:function(){
		var step=this.scrollStep;
		if(this.y-step+game.worldHeight<=this.worldWindow.height)
			step=this.y+game.worldHeight-this.worldWindow.height;
		if(step>0){
			this.verticalMove.start('top',this.y,this.y-step);
			this.y=this.y-step;
		}
	},
	moveDown:function(){
		var step=this.scrollStep;
		if(this.y+step>0)
			step=(-1)*this.y;
		if(step>0){
			this.verticalMove.start('top',this.y,this.y+step);
			this.y=this.y+step;
		}
	},
	resetIntoView:function(){
		if(this.x!=0){
			this.horizontalMove.set('left',0);
			this.x=0;
		}
		if(this.y!=0){
			this.verticalMove.set('top',0);
			this.y=0;
		}
	},
	insertObjectIntoWorld:function(obiect){
		obiect.comeIntoExistence(this);
	},
	getWorldWrapper:function(){
		return this.viewport;
	}
});

/* Funcion que inicializa el mundo del juego */

function iniciarMundo(){
	iniciarJuego();
}

/* Funcion que inicia el juego */

function empezarJuego(){
	var introDiv=new Element('div',{'class':'intro'});
	introDiv.set('html', 
		'<img src="./Imagenes/Titulo.png" /><br/><br/><br/>');
	var startButton=new Element('a',{'href':'#top','events':{'click':function(){
		var introEffect=new Fx.Tween(this,{'duration':500});
		introEffect.addEvent('onComplete',function(){
			this.destroy();
			iniciarMundo();
		}.bind(this));
		introEffect.start('opacity',1,0);
	}.bind(introDiv)}});

/* Boton para comenzar el juego y div que sera la pantalla del juego */

	startButton.set('text','Comenzar');
	startButton.inject(introDiv);
	var br=new Element('br');
	br.inject(introDiv);
	br.clone(false).inject(introDiv);
	introDiv.inject($('GameView'));
}

/* Valores del Juego */

GAMEUNITTYPE={GOODY:'Beneficio',WALL:'Muro',FAKEWALL:'FalsoMuro',BOMB:'Bomba',HERO:'Heroe',MONSTER:'Enemigo'}
GOODYSUBTYPE={EXIT:'Salida',LIFE:'Vida',BOMB:'Bomba',SPEED:'Velocidad',EXPLOSIONLENGTH:'duracionExplosion',PASSOVERFAKEWALLS:'passoverfakewalls'}
game.standardWidth=50;
game.standardHeight=50;
game.standardCost=3;
game.worldWidth=null;
game.worldHeight=null;
game.bombTimeOut=4000;
game.bombEffectDuration=315;
game.exit=null;
game.heart=null;
game.speed=30;
game.heroes=[];
game.fakeWalls=[];
game.zones=[];
game.walls=[];
game.goodies=[];
game.activeBombs=[];
game.level=1;
game.pause=false;

/* Clase Juego. Inidica por donde te puede mover. Si hay bombas o muros, no te deja avanzar. */

var Juego=new Class({
	Extends:ObjetoJuego,initialize:function(type){
		this.parent();
		this.type=type;
		this.HTMLIncarnation=new Element('div',{'class':type});
	},
	comeIntoExistence:function(world,_left,_top){
		this.parent(world);this.setPosition(_left,_top);
	},
	setPosition:function(l,t){
		if(this.x!=l){
			this.x=l;
			this.HTMLIncarnation.style.left=this.x;
		}
		if(this.y!=t){
			this.y=t;
			this.HTMLIncarnation.style.top=this.y;
		}
		if($defined(this.myZone)){
			var newZone=util.getZoneAtPoint(this.x,this.y);
			if(newZone!=this.myZone){
				newZone.addElement(this);
				this.freeMyZone();
				this.myZone=newZone;
			}
		}else{
			var gameZone=util.getZoneAtPoint(this.x,this.y);
			gameZone.addElement(this);this.myZone=gameZone;
		}
	},
	freeMyZone:function(){
		this.myZone.removeElement(this);
	},
	terminate:function(){
		this.freeMyZone();
		this.HTMLIncarnation.dispose();
		this.HTMLIncarnation.destroy();
	}
});

var StandardZone=new Class({initialize:function(){
		this.x=0;
		this.y=0;
		this.freeZone=true;
		this.type=['-'];
		this.elements=[];
		this.walkable=true;
	},
	addElement:function(el){
		this.elements.push(el);
		this.addType(el.type);
		this.freeZone=false;
	},
	removeElement:function(el){
		util.removeElementFromArray(el,this.elements);
		this.removeType(el.type);
		if(this.elements.length==0)
			this.freeZone=true;
	},
	hasElement:function(el){
		var exists=false;
		for(var i=0;i<this.elements.length;i++){
			if(this.elements[i]==el){
				exists=true;
				break;
			}
		}
		return exists;
	},
	getElements:function(){
		return this.elements;
	},
	hasType:function(_type){
		var typeExists=false;
		for(var i=0;i<this.type.length;i++){
			if(this.type[i]==_type){
				typeExists=true;
				break;
			}
		}
		return typeExists;
	},
	addType:function(_type){
		if(_type==GAMEUNITTYPE.WALL||_type==GAMEUNITTYPE.FAKEWALL||_type==GAMEUNITTYPE.BOMB)
			this.walkable=false;
		if(this.type.length==1&&this.type[0]=='-')
			this.setType(_type);
		else
			this.type[this.type.length]=_type;
	},
	setType:function(_type){
		this.type=[];
		this.type[0]=_type;
	},
	removeType:function(_type){
		util.removeElementFromArray(_type,this.type);
		if(this.type.length==0)
			this.type[0]='-';
		if(this.hasType(GAMEUNITTYPE.WALL)||this.hasType(GAMEUNITTYPE.FAKEWALL)||this.hasType(GAMEUNITTYPE.BOMB))
			this.walkable=false;
		else
			this.walkable=true;
	},
	types:function(){
		var types='';
		for(var i=0;i<this.type.length;i++){
			types=types+', '+this.type[i];
		}
		return types;
	},
	isWalkable:function(){
		return this.walkable;
	}
});

var Util=new Class({
	findMaximumDivider:function(number,divider){
		var ooo=parseInt(number/divider);
		return ooo*divider;
	},
	rePositionCoordinate:function(number,divider){
		var modulo=number%divider;
		var maxDivider=parseInt(number/divider);
		if(modulo==0)
			return number;
		if(modulo>(4/10)*divider&&modulo<(6/10)*divider){
			if(maxDivider%2==0){
				return maxDivider*divider;
			}else
				return number;
		}else{
			if(modulo<=(4/10)*divider){
				return maxDivider*divider;
			}
			if(modulo>=(6/10)*divider){
				return(maxDivider+1)*divider;
			}
		}
	},
	getZoneAtPoint:function(x,y){
		if(x>=game.worldWidth)
			x=game.worldWidth-1;
		if(y>=game.worldHeight)
			y=game.worldHeight-1;
		return game.zones[parseInt(x/game.standardWidth)][parseInt(y/game.standardHeight)];
	},
	removeElementFromArray:function(el,array){
		var idx=-1;
		for(var i=0;i<array.length;i++){
			if(array[i]==el){
				idx=i;
				break;
			}
		}
		if(idx!=-1)
			array.splice(i,1);
		}
});

/* Clase Beneficio. Clase que define los beneficios de los objetos que puedes conseguir. Tambien decide la probabilidad de que salgan. */
	
var Beneficio=new Class({
	Extends:Juego,initialize:function(subtype){
		this.parent(GAMEUNITTYPE.GOODY);
		game.goodies.push(this);
		if(subtype==null){
			if(game.exit==null){
				this.subtype=GOODYSUBTYPE.EXIT;
				game.exit=this;
			}else{
				var goodyProbability=Math.round(Math.random()*30);
				if(goodyProbability<21)
					this.subtype=GOODYSUBTYPE.BOMB;
				if(goodyProbability>=21&&goodyProbability<23)
					this.subtype=GOODYSUBTYPE.LIFE;
				if(goodyProbability>=23&&goodyProbability<25)
					this.subtype=GOODYSUBTYPE.SPEED;
				if(goodyProbability>=25&&goodyProbability<27)
					this.subtype=GOODYSUBTYPE.EXPLOSIONLENGTH;
				if(goodyProbability>=27&&goodyProbability<29)
					this.subtype=GOODYSUBTYPE.PASSOVERFAKEWALLS;
				if(goodyProbability>=29)
					this.subtype=GOODYSUBTYPE.SPEED;
			}
		}else{
			this.subtype=subtype;
		}
	},
	appear:function(zone){
		this.HTMLIncarnation.setStyle('background-image',"url('Imagenes/Especial-"+this.subtype+".png')");
		this.comeIntoExistence(game.world,zone.x,zone.y);
	},
	vaporate:function(){
		util.removeElementFromArray(this,game.goodies);
	},
	terminate:function(){
		this.vaporate();
		this.parent();
		if(this.subtype==GOODYSUBTYPE.EXIT)
			game.exit=null;
	}
});

/* Clase de los muros que no pueden romperse */

var Wall=new Class({
	Extends:Juego,
	initialize:function(){
		this.parent(GAMEUNITTYPE.WALL);
		game.walls.push(this);
	},
	erase:function(){
		util.removeElementFromArray(this,game.walls);
	},
	terminate:function(){
		this.erase();
		this.parent();
	}
});

/* Clase de los muros que si pueden romperse */

var FakeWall=new Class({
	Extends:Juego,
	initialize:function(){
		this.parent(GAMEUNITTYPE.FAKEWALL);
		game.fakeWalls.push(this);
		this.goody=null;
	},
	vaporate:function(){
		util.removeElementFromArray(this,game.fakeWalls);
	},
	setGoody:function(goodysubtype){
		if(goodysubtype!=null)
			this.goody=new Beneficio(goodysubtype);
		else{
			var goodyProbability=Math.round(Math.random()*30);
			if(goodyProbability>18){
				this.goody=new Beneficio(null);
			}
		}
	},
	terminate:function(){
		this.vaporate();
		this.parent();
		this.leaveGoodyBehind();
	},
	leaveGoodyBehind:function(){
		if(this.goody!=null){
			this.goody.appear(this.myZone);
		}
	}
});

/* Clase de las bombas */

var Bomb=new Class({
	Extends:Juego,
	initialize:function(x,y,hero){
		this.parent(GAMEUNITTYPE.BOMB);
		this.bombExplosionLength=2;
		var alignedX=x+game.standardWidth/2;
		var alignedY=y+game.standardHeight/2;
		if(alignedX%game.standardWidth!=0)
			alignedX=util.findMaximumDivider(alignedX,game.standardWidth);
		if(alignedY%game.standardHeight!=0)
			alignedY=util.findMaximumDivider(alignedY,game.standardHeight);
		this.comeIntoExistence(game.world,alignedX,alignedY);
		this.cancelFlag=this.explode.delay(game.bombTimeOut,this);
		this.hero=hero;
		game.activeBombs.push(this);
	},
	setExplosionLength:function(duracionExplosion){
		this.bombExplosionLength=duracionExplosion;
	},
	canExplodeIntoZone:function(zone){
		return(zone.freeZone||(!zone.freeZone&&!zone.hasType(GAMEUNITTYPE.WALL)));
	},
	explode:function(){
		this.HTMLIncarnation.style.backgroundImage="url('Imagenes/Explosion.png')";
		this.explodedZones=[];
		this.oldX=this.x;
		this.oldY=this.y;
		this.newX=this.x;
		this.newY=this.y;
		this.newWidth=game.standardWidth;
		this.newHeight=game.standardHeight;
		var stopMovingLeft=false;
		var stopMovingRight=false;
		var stopMovingTop=false;
		var stopMovingBottom=false;
		for(var i=0;i<this.bombExplosionLength;i++){
			var movedLeft=false;
			var movedUp=false;
			if(!stopMovingLeft&&this.newX-game.standardWidth/2>0){
				var leftZone=util.getZoneAtPoint(this.newX-game.standardWidth/2,this.y);
				if(this.canExplodeIntoZone(leftZone)){
					this.newX=this.newX-game.standardWidth;
					this.explodedZones.push(leftZone);
					movedLeft=true;
					if(leftZone.hasType(GAMEUNITTYPE.FAKEWALL)){
						stopMovingLeft=true;
					}
				}
			}
			if(!stopMovingRight&&this.newX+(this.newWidth+(movedLeft?1:0)*game.standardWidth)+game.standardWidth/2
				<game.worldWidth){
				var rightZone=util.getZoneAtPoint(this.newX
					+(this.newWidth+(movedLeft?1:0)*game.standardWidth)+game.standardWidth/2,this.y);
				if(this.canExplodeIntoZone(rightZone)){
					this.newWidth+=(movedLeft?2:1)*game.standardWidth;
					this.explodedZones.push(rightZone);
					if(rightZone.hasType(GAMEUNITTYPE.FAKEWALL)){
						stopMovingRight=true;
					}
				}
			}
			if(!stopMovingTop&&this.newY-game.standardHeight/2>0){
				var topZone=util.getZoneAtPoint(this.x,this.newY-game.standardHeight/2);
				if(this.canExplodeIntoZone(topZone)){
					this.newY=this.newY-game.standardHeight;
					this.explodedZones.push(topZone);
					movedUp=true;
					if(topZone.hasType(GAMEUNITTYPE.FAKEWALL)){
						stopMovingTop=true;
					}
				}
			}
			if(!stopMovingBottom&&this.newY+(this.newHeight+(movedUp?1:0)*game.standardHeight)+game.standardHeight/2
				<game.worldHeight){
				var bottomZone=util.getZoneAtPoint(this.x,this.newY+(this.newHeight+(movedUp?1:0)*game.standardHeight)
					+game.standardHeight/2);
				if(this.canExplodeIntoZone(bottomZone)){
					this.newHeight+=(movedUp?2:1)*game.standardHeight;
					this.explodedZones.push(bottomZone);
					if(bottomZone.hasType(GAMEUNITTYPE.FAKEWALL)){
						stopMovingBottom=true;
					}
				}
			}
		}
		var horizEffect=false;
		if(this.newX!=this.x||this.newWidth!=game.standardWidth){
			var horiz=new Fx.Morph(this.HTMLIncarnation,{duration:game.bombEffectDuration});
			horiz.addEvent('onComplete',function(){this.removeAshes();}.bind(this));
			horiz.start({'width':[game.standardWidth,this.newWidth],'left':[this.x,this.newX]});
			horizEffect=true;
		}
		var verticalEffect=false;
		if(this.newY!=this.y||this.newHeight!=game.standardHeight){
			this.clonedBomb=this.HTMLIncarnation.clone(false);
			this.clonedBomb.injectBefore(this.HTMLIncarnation);
			var vertical=new Fx.Morph(this.clonedBomb,{duration:game.bombEffectDuration});
			if(!horizEffect)
				vertical.addEvent('onComplete',function(){this.removeAshes();}.bind(this));
			vertical.start({'height':[game.standardHeight,this.newHeight],'top':[this.y,this.newY]});
			verticalEffect=true;
		}
		if(!horizEffect&&!verticalEffect){
			this.terminate();
		}
	},
	terminate:function(){
		if($defined(this.clonedBomb)){
			this.clonedBomb.dispose();
			this.clonedBomb.destroy();
		}
		$clear(this.cancelFlag);
		util.removeElementFromArray(this,game.activeBombs);
		this.parent();
	},
	removeAshes:function(){
		this.terminate();
		this.hero.returnBomb();
		var heroHit=false;
		for(var i=0;i<this.explodedZones.length;i++){
			var elements=this.explodedZones[i].getElements();
			for(var k=0;k<elements.length;k++){
				if(elements[k].type!=GAMEUNITTYPE.BOMB&&
					!(elements[k].type==GAMEUNITTYPE.GOODY&&elements[k].subtype==GOODYSUBTYPE.EXIT))
					elements[k].terminate();if(elements[k]==game.hero)
					heroHit=true;
			}
		}
		if($defined(game.hero)&&!heroHit){
			if(this.newX!=this.x||this.newWidth!=game.standardWidth){
				if(!(game.hero.x+game.standardWidth<=this.newX||game.hero.x>=this.newX+this.newWidth
					||game.hero.y+game.standardHeight<=this.oldY||game.hero.y>=this.oldY+game.standardHeight))
					game.hero.terminate();
			}
		}
		if($defined(game.hero)&&!heroHit){
			if(this.newY!=this.y||this.newHeight!=game.standardHeight){
				if(!(game.hero.y+game.standardHeight<=this.newY||game.hero.y>=this.newY+this.newHeight
					||game.hero.x+game.standardWidth<=this.oldX||game.hero.x>=this.oldX+game.standardWidth))
					game.hero.terminate();
			}
		}
		for(var i=0;i<game.heroes.length;i++){
			var hero=game.heroes[i];
			if($defined(hero)){
				if(this.newX!=this.x||this.newWidth!=game.standardWidth){
					if(!(hero.x+game.standardWidth<=this.newX||hero.x>=this.newX+this.newWidth
						||hero.y+game.standardHeight<=this.oldY||hero.y>=this.oldY+game.standardHeight))
					hero.terminate();
				}
			}
			if($defined(hero)){
				if(this.newY!=this.y||this.newHeight!=game.standardHeight){
					if(!(hero.y+game.standardHeight<=this.newY||hero.y>=this.newY+this.newHeight
						||hero.x+game.standardWidth<=this.oldX||hero.x>=this.oldX+game.standardWidth))
						hero.terminate();
				}
			}
		}
	}
});

/* Clase del Heroe, el personaje principal. Sirve para mover al heroe. Tambien para comprobar las colisiones, si has muerto, etc. */

var Hero=new Class({
	Extends:Juego,initialize:function(type){
		if($defined(type))
			this.parent(type);
		else
			this.parent(GAMEUNITTYPE.HERO);
		this.currentDirection=null;
		this.sense=0;this.cuanta=2;
		this.width=game.standardWidth;
		this.height=game.standardHeight;
		this.hitWorldBoundary=false;
		this.hitTheWall=false;
		this.bombExplosionLength=1;
		this.numberOfBombs=1;
		this.currentSpriteFrame={x:0,y:0};
		this.spriteAnimationSpeed=5;
		this.spriteAnimationIndex=0;
		this.score=0;
		this.canFlyOverFakeWalls=false;
		this.life=1;
	},
	setExplosionLength:function(duracionExplosion){
		this.bombExplosionLength=duracionExplosion;
	},
	processKeyPressedInput:function(keyCode){
		if(keyCode==39){
			this.currentDirection='left';
			this.sense=1;
			this.spriteY=50;
		}
		if(keyCode==37){
			this.currentDirection='left';
			this.sense=-1;
			this.spriteY=100;
		}
		if(keyCode==40){
			this.currentDirection='top';
			this.sense=1;
			this.spriteY=200;
		}
		if(keyCode==38){
			this.currentDirection='top';
			this.sense=-1;
			this.spriteY=150;
		}
	},
	processKeyUpInput:function(keyCode){
		this.sense=0;
		this.spriteY=1;
		this.updateHeroSprite();
	},
	processKeyDownInput:function(keyCode){
		this.processKeyPressedInput(keyCode);
	},
	launchBomb:function(){
		if(this.numberOfBombs>0){
			this.bombLaunched=true;
			this.numberOfBombs--;
			var bomb=new Bomb(this.x,this.y,this);
			bomb.setExplosionLength(this.bombExplosionLength);
		}
	},
	returnBomb:function(){
		this.bombLaunched=false;
		this.numberOfBombs++;
	},
	setNumberOfBombs:function(noBombs){
		this.numberOfBombs=noBombs;
	},
	updateHeroSprite:function(){
		if(this.spriteAnimationIndex>=this.spriteAnimationSpeed){
			this.spriteAnimationIndex=0;
		}else{
			this.spriteAnimationIndex++;
			return;
		}
		if(this.currentSpriteFrame.y!=this.spriteY){
			this.currentSpriteFrame.y=this.spriteY;
			this.spriteX=game.standardWidth;
		}else{
			this.spriteX+=game.standardWidth;
			if(this.spriteX>=250)
				this.spriteX=game.standardWidth;
			this.currentSpriteFrame.x=this.spriteX;
		}
		this.HTMLIncarnation.style.backgroundPosition=this.spriteX+'px '+this.spriteY+'px';
	},
	moveAlongDirection:function(){
		if(this.sense==0)
			return;
		var currentPosition=0;
		var newPosition=0;
		if(this.currentDirection=='left'){
			currentPosition=this.x;
			newPosition=currentPosition+(this.sense*this.cuanta);
			if((newPosition<0&&this.sense<0)||(this.sense>0&&newPosition>game.worldWidth-game.standardWidth)){
				this.hitWorldBoundary=true;
				return;
			}
		}
		if(this.currentDirection=='top'){
			currentPosition=this.y;newPosition=currentPosition+(this.sense*this.cuanta);
			if((this.sense<0&&newPosition<0)||(this.sense>0&&newPosition>game.worldHeight-game.standardHeight)){
				this.hitWorldBoundary=true;
				return;
			}
		}
		var repositionedX=this.x;
		var repositionedY=this.y;
		if(this.currentDirection=='left'){
			repositionedY=util.rePositionCoordinate(this.y,game.standardHeight);
			if(repositionedY!=this.y){
				this.y=repositionedY;
				this.HTMLIncarnation.style.top=this.y+'px';
			}
		}
		if(this.currentDirection=='top'){
			repositionedX=util.rePositionCoordinate(this.x,game.standardWidth);
			if(repositionedX!=this.x){
				this.x=repositionedX;
				this.HTMLIncarnation.style.left=this.x+'px';
			}
		}
		if(!this.canFlyOverFakeWalls)
			this.hitTheWall=this.world.checkForCollisionWithWalls(this,
				(this.currentDirection=='left')?newPosition:repositionedX,
				(this.currentDirection=='top')?newPosition:repositionedY,this.currentDirection);
		else
			this.hitTheWall=false;
		if(!this.hitTheWall){
			if(this.reborn){
				this.reborn=false;
				return;
			}
			if(this.currentDirection=='left'){
				this.x=newPosition;
				this.HTMLIncarnation.style.left=newPosition+'px';
			}
			if(this.currentDirection=='top'){
				this.y=newPosition;
				this.HTMLIncarnation.style.top=newPosition+'px';
			}
		}else{
			if(this.currentDirection=='left'){
				var wallposition=this.x%game.standardWidth;
				if(wallposition!=0){
					if(wallposition<game.standardWidth/2)
						this.x-=wallposition;
					else
						this.x+=game.standardWidth-wallposition;
						this.HTMLIncarnation.style.left=this.x+'px';
				}
			}
			if(this.currentDirection=='top'){
				var wallposition=this.y%game.standardHeight;
				if(wallposition!=0){
					if(wallposition<game.standardHeight/2)
						this.y-=wallposition;
					else
						this.y+=game.standardHeight-wallposition;
						this.HTMLIncarnation.style.top=this.y+'px';
				}
			}
		}
		if(this.x<0)
			this.x=0;if(this.y<0)
		this.y=0;
		this.updateHeroSprite();
		var newZone=util.getZoneAtPoint(this.x,this.y);
		if(newZone!=this.myZone){
			if(this.canFlyOverFakeWalls){
				newZone.addElement(this);
				this.myZone.removeElement(this);
				this.myZone=newZone;
			}else{
				if(newZone.isWalkable()){
					newZone.addElement(this);
					this.myZone.removeElement(this);
					this.myZone=newZone;
				}else{
					if((newZone.hasType(GAMEUNITTYPE.WALL)||newZone.hasType(GAMEUNITTYPE.FAKEWALL))&&
						game.debug==0&&!this.canFlyOverFakeWalls){
							debugger;
					}
				}
			}
		}
	},
	assimilateGoody:function(zone){
		var elements=zone.getElements();
		var goody=null;
		for(var i=0;i<elements.length;i++){
			if(elements[i].type==GAMEUNITTYPE.GOODY){
				goody=elements[i];
				break;
			}
		}
		if(goody.subtype==GOODYSUBTYPE.EXIT){
			if(game.heroes.length==0){
				this.reborn=true;
				goody.terminate();
				generateNextLevel();
			}
		}else{
			if(goody.subtype==GOODYSUBTYPE.LIFE){
				this.life++;
			}
			if(goody.subtype==GOODYSUBTYPE.SPEED){
				this.cuanta++;
			}
			if(goody.subtype==GOODYSUBTYPE.BOMB){
				this.numberOfBombs++;
			}
			goody.terminate();
		}
	},
	terminate:function(){
		this.life--;
		if(this.life>0)
			return;
		this.parent();
		this.scream();
		this.die();
	},
	die:function(){
		var bombExplosionLength=this.bombExplosionLength;
		var numberOfBombs=this.numberOfBombs;
		var speed=this.cuanta;
		if($defined(this.bombLaunched)&&this.bombLaunched)
			numberOfBombs++;
		$('Marcador').set('text','0');
		this.score=0;
		game.hero=null;
		restartLevel(speed,bombExplosionLength,numberOfBombs);
	},
	addPointsToScore:function(points){
		this.score+=points;
		$('Marcador').set('text',this.score);
	},
	scream:function(){
	}
});

/* Definicion de la clase global de los enemigos */

var BadGuy=new Class({
	Extends:Hero,
	initialize:function(){
		this.parent(GAMEUNITTYPE.MONSTER);
		game.heroes.push(this);
		this.currentDirection='left';
		this.horizontalStepsBeforeChangeDirection=4;
		this.verticalStepsBeforeChangeDirection=2;
		this.delayBeat=0;
		this.sense=1;
		this.delayBeatContor=0;
		this.deltaX=0;
		this.deltaY=0;
		this.points=50;
		this.cuanta=2;
	},
	moveAlongDirection:function(){
		if(this.delayBeatContor<=this.delayBeat){
			this.delayBeatContor++;
			this.cuanta=1;
		}
		this.cuanta=2;
		this.delayBeatContor=0;
		this.parent();
		this.badGuyMove();
		this.killTheHero();
	},
	badGuyMove:function(){
		if(this.hitWorldBoundary==true){
			this.sense=this.sense*(-1);
			this.hitWorldBoundary=false;
		}
		if(this.hitTheWall){
			var randy=Math.round(Math.random()*8);
			if(randy>3){
				this.sense=this.sense*(-1);
			}else{
				if(this.currentDirection=='left')
					this.currentDirection='top';
				else
					this.currentDirection='left';
			}
		}else{
			if(this.currentDirection=='left'){
				this.deltaX+=this.cuanta;
				if(this.deltaX>=this.horizontalStepsBeforeChangeDirection*game.standardWidth){
					this.deltaX=0;
					var randy=Math.round(Math.random()*8);
					if(randy>4)
						this.currentDirection='top';
					else
						this.sense=this.sense*(-1);
						this.horizontalStepsBeforeChangeDirection=Math.round(Math.random()*(game.worldWidth/game.standardWidth));
				}
			}
			if(this.currentDirection=='top'){
				this.deltaY+=this.cuanta;
				if(this.deltaY>=this.verticalStepsBeforeChangeDirection*game.standardHeight){
					this.deltaY=0;
					var randy=Math.round(Math.random()*8);
					if(randy>4)
						this.currentDirection='left';
					else
						this.sense=this.sense*(-1);
					this.verticalStepsBeforeChangeDirection=Math.round(Math.random()*(game.worldHeight/game.standardHeight));
				}
			}
		}
	},
	updateHeroSprite:function(){
	},
	die:function(){
		util.removeElementFromArray(this,game.heroes);
		if($defined(game.hero))
			game.hero.addPointsToScore(this.points);
	},
	killTheHero:function(){
		if($defined(game.hero)){
			if(!(game.hero.x+game.standardWidth<=this.x||game.hero.x>=this.x+game.standardWidth||
				game.hero.y>=this.y+game.standardHeight||game.hero.y+game.standardHeight<=this.y))
				game.hero.terminate();
		}
	}
});

/* Clase Enemigo capaz de atravesar muros falsos */

var EnemigoA=new Class({
	Extends:BadGuy,
	initialize:function(){
		this.parent();
		this.HTMLIncarnation.setStyle('background-image',"url('Imagenes/Enemigo1.png')");
		this.canFlyOverFakeWalls=true;
	}
});

/* Clase Enemigo Normal Tipo 1 */

var EnemigoB=new Class({
	Extends:BadGuy,
	initialize:function(){
		this.parent();
		this.HTMLIncarnation.setStyle('background-image',"url('Imagenes/Enemigo2.png')");
		this.points=100;
		this.pathToHero=[];
		this.delayBeat=-1;
		this.lookForHeroCounter=0;
		this.lookForHeroInterval=Math.round(3000/game.speed);
	},
	badGuyMove:function(){
		if(parseInt(Math.sqrt(Math.pow(this.myZone.x-game.hero.myZone.x,2)+Math.pow(this.myZone.y-game.hero.myZone.y,2)))>400){
			this.parent();
			return;
		}
		if(this.hitWorldBoundary==true){
			this.sense=this.sense*(-1);
			this.hitWorldBoundary=false;
		}
		if(this.hitTheWall&&this.pathToHero.length==0){
			var randy=Math.round(Math.random()*8);
			if(randy>3){
				this.sense=this.sense*(-1);
			}else{
				if(this.currentDirection=='left')
					this.currentDirection='top';
				else
					this.currentDirection='left';
			}
		}else{
			if(this.lookForHeroCounter>this.lookForHeroInterval){
				this.lookForHeroCounter=0;
				var aStarPath=new AStarPath(this.myZone,game.hero.myZone);
				this.pathToHero=aStarPath.computeAStarPath();
				this.lookForHeroInterval=Math.round(3000/game.speed)+Math.round(Math.random()*30);
				this.nextZone=null;
				this.nextZoneIndex=0;
			}
			this.lookForHeroCounter++;
			if(this.pathToHero.length>0){
				if(!$defined(this.nextZone)){
					this.nextZone=this.pathToHero[0].zone;
					this.nextZoneIndex=0;
				}else{
					if(this.nextZone.x==this.myZone.x&&this.nextZone.y==this.myZone.y){
						this.nextZoneIndex++;
						if($defined(this.pathToHero[this.nextZoneIndex]))
							this.nextZone=this.pathToHero[this.nextZoneIndex].zone;
					}else{
						if(this.nextZone.x==this.myZone.x){
							var modulo=this.x%game.standardWidth;
							var maxDivider=parseInt(this.x/game.standardWidth);
							if(this.currentDirection=='left'){
								if(maxDivider%2==0&&!(modulo>(4/10)*game.standardWidth&&modulo<(6/10)*game.standardWidth)){
									if(this.hitTheWall)
										this.currentDirection='top';
								}else{
									this.currentDirection='top';
									this.sense=1*(this.nextZone.y>this.myZone.y?1:-1);
								}
							}else
								this.sense=1*(this.nextZone.y>this.myZone.y?1:-1);
						}
						if(this.nextZone.y==this.myZone.y){
							var modulo=this.y%game.standardHeight;
							var maxDivider=parseInt(this.y/game.standardHeight);if(this.currentDirection=='top'){
								if(maxDivider%2==0&&!(modulo>(4/10)*game.standardHeight&&modulo<(6/10)*game.standardHeight)){
									if(this.hitTheWall)
										this.currentDirection='left';
								}else{
									this.currentDirection='left';
									this.sense=1*(this.nextZone.x>this.myZone.x?1:-1);
								}
						}else
							this.sense=1*(this.nextZone.x>this.myZone.x?1:-1);
						}
						if(this.nextZone.y!=this.myZone.y&&this.nextZone.x!=this.myZone.x){
						}
					}
				}
			}
		}
	}
});

/* Clase Enemigo Normal Tipo 2*/

var FBadGuy=new Class({
	Extends:BadGuy,
	initialize:function(){
		this.parent();
		this.HTMLIncarnation.setStyle('background-image',"url('Imagenes/Enemigo3.png')");
		this.fCounter=0;
		this.changeInterval=150+Math.round(Math.random()*50);
	},
	updateHeroSprite:function(){
		if(this.fCounter>=this.changeInterval){
			if(this.life==0){
				this.life=99999;
				this.HTMLIncarnation.setStyle('background-image',"url('Imagenes/Enemigo4.png')");
			}else{
				this.life=0;
				this.HTMLIncarnation.setStyle('background-image',"url('Imagenes/Enemigo1.png')");
			}
			this.fCounter=0;
		}
		this.fCounter++;
	}
});

var util=new Util();

World.implement({
	checkForCollisionWithWalls:function(Juego,newX,newY,direction){
		var hit=false;
		var currentZone=null;
		var currentZoneFreeZone=true;
		if((newX<=Juego.x&&newY==Juego.y)||(newX==Juego.x&&newY<=Juego.y)){
			currentZone=util.getZoneAtPoint(newX,newY);
			if($defined(currentZone)){
				currentZoneFreeZone=currentZone.isWalkable();
				if(currentZoneFreeZone==false){
					if(Juego.myZone==currentZone)
						currentZoneFreeZone=true;
				}
			}
		}
		var nextZone=null;
		var nextZoneFreeZone=true;
		if(direction=='left'){
			if(newX>Juego.x){
				nextZone=util.getZoneAtPoint(newX+game.standardWidth,newY);
				if($defined(nextZone)){
					nextZoneFreeZone=nextZone.isWalkable();
				}
			}else{
				nextZoneFreeZone=true;
			}
		}
		if(direction=='top'){
			if(newY>Juego.y){
				nextZone=util.getZoneAtPoint(newX,newY+game.standardHeight);
				if($defined(nextZone)){
					nextZoneFreeZone=nextZone.isWalkable();
				}
			}else{
				nextZoneFreeZone=true;
			}
		}
		if(!(currentZoneFreeZone&&nextZoneFreeZone)){
			hit=true;
			if(Juego.type==GAMEUNITTYPE.HERO){
				var movedIntozone=currentZone==null?nextZone:currentZone;
				if(movedIntozone.hasType(GAMEUNITTYPE.MONSTER)){
					var badguys=movedIntozone.getElements();
					for(var i=0;i<badguys.length;i++){
						if(badguys[i].type==GAMEUNITTYPE.MONSTER)
							badguys[i].killTheHero();
						break;
					}
					hit=false;
				}
			}
		}else{
			if(Juego.type==GAMEUNITTYPE.HERO){
				var movedIntozone=currentZone==null?nextZone:currentZone;
				if(movedIntozone.hasType(GAMEUNITTYPE.GOODY))
					Juego.assimilateGoody(movedIntozone);
			}
		}
		return hit;
	}
});

function keyPressedInputForwarder(e){
	if(window.event){
		window.event.cancelBubble=true;
		window.event.returnValue=false;
	}else{
		if(e.stopPropagation){
			e.stopPropagation();
			e.preventDefault();
		}
	}
	if(!$defined(game.heart))
		return;
	var keyCode=window.event?event.keyCode:e.keyCode;
	if(keyCode>=37&&keyCode<=40){
		if($defined(game.hero))
			game.hero.processKeyPressedInput(keyCode);
		}else{
			if(keyCode!=27)
				keyCode=window.event?keyCode:e.charCode;
			if(keyCode==112||keyCode==80||keyCode==27){
				game.pause=game.pause?false:true;
				if(!game.pause){
					worldbeat();
				}
			}
		}
	}
	function keyUpInputForwarder(e){
		if(!$defined(game.heart))
			return;
		var keyCode=window.event?event.keyCode:e.keyCode;
		if(keyCode==32){
		}else{
			if($defined(game.hero)){
				if(parseInt(keyCode)>=37&&parseInt(keyCode)<=40){
					game.hero.processKeyUpInput(keyCode);
				}
			}
		}
	}
	function keyDownInputForwarder(e){
		if(!$defined(game.heart))
			return;
		var keyCode=window.event?(event.charCode||event.keyCode):(e.charCode||e.keyCode);
		if(keyCode==32){
			if($defined(game.hero)){
				if($defined(game.lastKeyCodeSentToServer))
					sendInfoToServer('info=I:'+keyCode+'&'+computeVerificationStatus());
				game.hero.launchBomb();
			}
			if(window.event){
				window.event.cancelBubble=true;
				window.event.returnValue=false;
			}else{
				if(e.stopPropagation){
					e.stopPropagation();
					e.preventDefault();
				}
			}
		}else{
			if($defined(game.hero)){
				if(parseInt(keyCode)>=37&&parseInt(keyCode)<=40){
					game.hero.processKeyDownInput(keyCode);
				}
			}
		}
	}
	function worldbeat(){
		if(game.pause)
			return;
		if(game.stateCounter<5)
			clearTimeout(game.heart);
		game.stateCounter++;
		var heartBeatTime=(new Date()).getTime();
		if($defined(game.hero))
			game.hero.moveAlongDirection();
		else
			return;
		var others=game.heroes;
		var othersLength=others.length;
		for(var i=0;i<othersLength;i++){
			if(game.stateCounter>0)
				others[i].moveAlongDirection();
			}
			checkGlobalPosition();
			var nextCall=game.speed-((new Date()).getTime()-heartBeatTime);
			if(nextCall<=0)
			nextCall=2;
			if($defined(game.heart)&&$defined(game.hero)){
				game.heart=setTimeout("worldbeat()",nextCall);
			}
		}
		function checkGlobalPosition(){
			if(!$defined(game.hero))
				return;
			if(game.hero.x+game.standardWidth+game.world.x>game.world.worldWindow.width-
				(game.standardWidth+10)&&game.world.x+game.world.width>game.world.worldWindow.width){
				game.world.moveLeft();
				return;
			}
			if(game.hero.x+game.world.x<game.standardWidth+10&&game.hero.x>0){
				game.world.moveRight();
				return;
			}
			if(game.hero.y+game.standardHeight+game.world.y>game.world.worldWindow.height-(game.standardHeight+10)){
				game.world.moveUp();
				return;
			}
			if(game.hero.y+game.world.y<(game.standardHeight+10)){
				game.world.moveDown();
				return;
			}
		}
		document.onkeypress=keyPressedInputForwarder;
		document.onkeyup=keyUpInputForwarder;
		document.onkeydown=keyDownInputForwarder;
		var server=false;
		window.addEvent('domready',empezarJuego);
		function clearOldLevel(){
			if($defined(game.heart)){
				clearTimeout(game.heart);
				game.stateCounter=0;
				game.heart=null;
				while(game.activeBombs.length>0){
					game.activeBombs[0].terminate();
				}
				while(game.heroes.length>0){
					game.heroes[0].terminate();
				}
				while(game.fakeWalls.length>0){
					game.fakeWalls[0].terminate();
				}
				while(game.walls.length>0){
					game.walls[0].terminate();
				}
				while(game.goodies.length>0){
					if(game.goodies[0].subtype==GOODYSUBTYPE.EXIT){
						game.goodies[0].HTMLIncarnation.dispose();
						game.goodies[0].HTMLIncarnation.destroy();
						game.goodies[0].vaporate();
					}else{
						game.goodies[0].terminate();
					}
				}
				for(var i=0;i<game.zones.length;i++){
					game.zones[i]=null;
				}
				game.zones=[];
				game.world.resetIntoView();
			}
		}
		function generateNextLevel(){
			game.level++;
			generateLevel(game.hero.cuanta,game.hero.bombExplosionLength,game.hero.numberOfBombs,700,800,1+game.level,true);
		}
		function generateLevel(heroSpeed,bombExplosionLength,numberOfBombs,worldWidth,worldHeight,numberOfBadGuys,empezarJuego){
			clearOldLevel();
			game.heroes=[];
			game.fakeWalls=[];
			game.zones=[];
			game.walls=[];
			game.goodies=[];
			if(worldWidth%game.standardWidth!=0||worldHeight%game.standardHeight!=0){
				alert('worldWidth='+worldWidth+' must be multiple of '+game.standardWidth+' and worldHeight='+worldHeight
				+' must be multiple of '+game.standardHeight);
				return;
			}
			game.worldWidth=worldWidth;
			game.worldHeight=worldHeight;
			if($defined(game.world)){
				game.world.changeWorldParameters(worldWidth,worldHeight);
			}else{
				var world=new World(worldWidth,worldHeight);
				world.start();
				game.world=world;
			}
			var xZones=parseInt(game.worldWidth/game.standardWidth);
			var yZones=parseInt(game.worldHeight/game.standardHeight);
			game.zones=new Array(xZones);
			for(var i=0;i<xZones;i++){
				game.zones[i]=new Array(yZones);
				for(var j=0;j<yZones;j++){
					var zone=new StandardZone();
					zone.x=game.standardWidth*i;
					zone.y=game.standardHeight*j;
					game.zones[i][j]=zone;
				}
			}
			var xNumberOfWalls=Math.floor(xZones/2);
			var yNumberOfWalls=Math.floor(yZones/2);
			for(i=0;i<xNumberOfWalls;i++){
				for(j=0;j<yNumberOfWalls;j++){
					var wall=new Wall();
					wall.comeIntoExistence(game.world,game.standardWidth+2*i*game.standardWidth,
						game.standardHeight+2*j*game.standardHeight);
				}
			}
			var fakeWallsNumberOnX=Math.round(Math.random()*(xZones-3));
			for(i=0;i<yZones;i++){
				for(j=0;j<fakeWallsNumberOnX;j++){
					var xPos=Math.round(Math.random()*xZones);
					if(xPos>1)
						xPos--;
					if((i==0&&xPos==0)||(i==0&&xPos==1)||(i==1&&xPos==0))
						continue;
					if(game.zones[xPos][i].freeZone){
						var fakeWall=new FakeWall();
						fakeWall.setGoody(null);
						fakeWall.comeIntoExistence(game.world,xPos*game.standardWidth,i*game.standardHeight);
					}
				}
			}
			if(!$defined(game.hero)){
				var hero=new Hero();
				hero.setExplosionLength(bombExplosionLength);
				hero.setNumberOfBombs(numberOfBombs);
				hero.cuanta=heroSpeed;
				hero.score=parseInt($('Marcador').get('text'));
				hero.comeIntoExistence(game.world,0,0);
				game.hero=hero;
			}else{
				game.hero.setPosition(0,0);
			}
			var contorBadGuys=0;
			for(j=0;j<yZones;j++){
				if(contorBadGuys>numberOfBadGuys)
					break;
				var doit=Math.round(Math.random()*4);
				if(doit>2){
					for(var k=0;k<xZones;k++){
						if(j<=4&&k<=4)
							continue;
						var doit2=Math.round(Math.random()*12);
						var gameZone=game.zones[k][j];
						if(gameZone.freeZone&&doit2>8){
							var badguy;
							switch(doit2){
								case 11:badguy=new BadGuy();
									break;
								case 10:badguy=new EnemigoA();
									break;
								case 9:badguy=new FBadGuy();
									break;
								default:badguy=new EnemigoB();
							}
							badguy.comeIntoExistence(game.world,gameZone.x,gameZone.y);
							contorBadGuys++;
							if(contorBadGuys>=numberOfBadGuys)
								break;
						}
					}
				}
			}
			if(empezarJuego){
				game.stateCounter=0;
				if(game.heart==null)
					game.heart=setTimeout("worldbeat()",game.speed);
			}
		}
		function restartLevel(heroSpeed,bombExplosionLength,numberOfBombs){
			generateLevel(heroSpeed,bombExplosionLength,numberOfBombs,700,800,3+game.level,true);
		}
		function iniciarJuego(){
			generateLevel(2,3,1,700,700,2,true);
		}