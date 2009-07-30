var CaseClass = {
	caseclassSub2: function() {
		for (var k = 0; k < arguments.length; k++)
		{
			this[this.propertyNames[k]] = arguments[k];
		}		
	},
	
	caseclassSub: function() {
		var args = arguments[0];
		var anonFunc = this.caseclassSub2;
		anonFunc.prototype.propertyNames = args;
		for (var k = 0; k < args.length; k++)
		{
			anonFunc.prototype[args[k]] = null;
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
			// if both objects have the same number of defined properties then they could be equal, investigate
			else if (this.propertyNames.length == anObject.propertyNames.length) {
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
				if (this.equals(caseTest)) {
					return caseFunction();
				}
			}
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
		this[className] = this.caseclassSub(args.shift());
	}
}
