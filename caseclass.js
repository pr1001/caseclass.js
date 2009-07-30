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
