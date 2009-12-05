// to extend native objects with equals() method so that they can use match()
// String.prototype.equals = function(str2) { return (this == str2); }

var CaseClass = {
  globals: false,

	caseclass: function() {
		for (var k = 0; k < arguments.length; k++)
		{
			this[this.propertyNames[k]] = arguments[k];
		}
	},
	
	constructClass: function() {
		var className = arguments[0];
		var args = arguments[1];
		var anonFunc = this.caseclass;
		anonFunc.prototype.className = className;
		anonFunc.prototype.propertyNames = args;
		for (var k = 0; k < args.length; k++)
		{
			anonFunc.prototype[args[k]] = null;
		}
		
		anonFunc.prototype.toString = function() {
  		return this.className + "(" + this.propertyNames.map(function(key) { return this[key] }, this).join(", ") + ")";
		}
		
		/* equality function */
		anonFunc.prototype.equals = function() {
			var args = Array.prototype.slice.call(arguments);
			if (args.length == 0) { throw new Error("comparison object required"); }
			var anObject = args.shift();
			
			if (this == anObject)
			{
				return true;
			}
			// else if both objects are of the same case class and have the same number of defined properties then they could be equal, investigate
			else if (this.className == anObject.className && this.propertyNames.length == anObject.propertyNames.length) {
				for (var k = 0; k < this.propertyNames.length; k++) {
					// if any of the properites do not match, the objects are not equal
					if (this[this.propertyNames[k]] != anObject[anObject.propertyNames[k]]) {
						return false;
					}
				}
				return true;
			}			
			return false;
		}
		
		// @param a variable number of {caseTest: someObject, caseFunction: someFunc} tuples
		anonFunc.prototype.match = function() {
			if (arguments.length == 0) { throw new Error("at least one case tuple required"); }
			for (var k = 0; k < arguments.length; k++)
			{
				try {
					var caseTuple = arguments[k];
					var caseTest = caseTuple.caseTest;
					var caseFunction = caseTuple.caseFunction;
				} catch (e) {
					throw new Error("malformed case tuple");
					// stop matching
					return false;
				}
				
				// if our case class equals the case test provided, call and return the case function provided
				// ideally we'd actually check if caseTest is a case class instance, rather than just an object
				if (typeof(caseTest) == "object" && this.equals(caseTest)) {
					return caseFunction();
				}
				// else if our case class is an instance of the caseTest,
				//   implying we've been passed the constructor since the previous test failed so it's not another instance
				else if ((typeof(caseTest) == "function") && (this instanceof caseTest)) {
  				return caseFunction();
				}
				// else if we're able to use the case class's extractor on caseTest to get some variables that we should pass on to caseFunction
				// NOTE: every extracted variable must have a toString method that gives a string that is able to be eval'ed to be reconstructed
				else if (typeof(caseTest) == "string" && this.unapply(caseTest)) {
  				var extracted = this.unapply(caseTest);
  				if (extracted === true) { var tmpStr = ""; }
  				else { var tmpStr = extracted.join(", "); }
  				return eval("caseFunction(" + tmpStr + ")");
				}
			}
		}
						
		/*
			Following Scala's case classes, the unapply method is used to test for equality and to extract the class class's properties.
			For example usage, see the README document.
			For more on case classes, see "Matching Objects with Patterns": http://lamp.epfl.ch/~emir/written/MatchingObjectsWithPatterns-TR.pdf
		*/
		anonFunc.prototype.unapply = function(extractor_pattern) {
  		// regex to look for class declaration in the format CaseClass(extractor_pattern)
  		var re = /^(\w+)(?:\()(.*?)\)$/
  		var result = re.exec(extractor_pattern)
  		// then they did specify the class
  		if (result) {
    		// if our class name doesn't match the class name in the pattern, return false
    		if (this.className != result[1]) { return false }
    		// if the user gave no pattern between the parentheis, return true
    		if (result[2] == "") { return true }
    		// reassign extractor_pattern the pattern we found between the parenthesis
    		extractor_pattern = result[2]
  		}
  		  		
  		var items = extractor_pattern.split(',');
  		
  		// special check for someone using a string to refer to the case class
  		/*
        if (items.length == 1 && this.propertyNames.length == 0 && items[0] == this.className) { 
      		items = [];
      		extracted = false;
    		}
      */
  		
  		// check that the user hasn't passed in an excessive amount of parameters
  		if (items.length > this.propertyNames.length) { throw new Error("More parameters passed than there are properties in the case class") }
  		var newitems = []; // currently unused, perhaps useful for future features such as conditional extractors
  		var extracted = [];
  		// go through all extractor items
  		for (var k = 0; k < items.length; k++) {
    		// trim string
    		var item = items[k].replace(/^\s+|\s+$/g, '');
        // if the item looks like a variable name
    		if (item.match(/^\d*[a-z][a-z0-9]*$/i)) {
      		// then we assign it the value of the appropriate property of the case class
      		var tmp = this[this.propertyNames[k]];
      		// wrap strings in quotation marks and escape any single quotes (and yes, it's silly how I did it)
      		if (typeof(tmp) == "string") { tmp = "'" + tmp.split('').map(function(chr) { return chr.replace("'", "\\'") }).join('') + "'"; }
      		extracted.push(tmp);
      		newitems.push({type: 'var', name: item, value: this[this.propertyNames[k]]}) // see variable declaration above
    		}
    		// else just use item as-is for our matching
    		else {
      		// remove any quotation marks at the beginning or end of the string
      		item = item.replace(/^[\'\"]+|[\'\"]+$/g, '');
      		// return false if item does not equal the equivalent propety of the case class
      		if (item != this[this.propertyNames[k]]) { return false }
      		
      		// wrap strings in quotation marks and escape any single quotes (and yes, it's silly how I did it)
      		if (typeof(item) == "string") { item = "'" + item.split('').map(function(chr) { return chr.replace("'", "\\'") }).join('') + "'"; }
      		extracted.push(item);
      		newitems.push({type: 'val', name: this.propertyNames[k], value: item}) // see variable declaration above
    		}
  		}
  		if (extracted.length == 0) { extracted = false }
  		return extracted;
		}
		
		return anonFunc;
	},
	
	/*
		Creates a Scala-style case class based upon a name and property list you provide:
			CaseClass.create("Stuff", ["name", "age"]);
		The class can be used like so:
			new CaseClass.Stuff("Peter", 24);
	*/
	create: function() {
		var args = Array.prototype.slice.call(arguments);
		if (args == 0) { throw new Error("case class name required"); }
		var className = args.shift();
		this[className] = this.constructClass(className, args.shift());
		if (this.globals) { window[className] = this[className]; }
	}
}
