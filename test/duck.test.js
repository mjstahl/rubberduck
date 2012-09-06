var duck = require('../lib/rubberduck');

exports.duckPunchSimple = function(test)
{
	test.expect(4);
	var obj = {
		number : 42,
		method : function()
		{
			return this.number;
		}
	};
	
	var emitter = duck.emitter(obj).punch('method');
	
	emitter.on('before', function() {
		test.ok(true, "before ran");
	});
	
	emitter.on('beforeMethod', function(args, context) {
		test.equal(context.number, 42);
		test.ok(true, "beforeMethod ran");
	});
	
	test.equal(obj.method(), 42);
	
	test.done();
};

exports.duckPunchThrow = function(test)
{
	var totalRuns = 12;
	test.expect(totalRuns);
	var obj = {
	    syncMethod: function() { throw "go apple"; },
	    asyncMethod1: function(callback) { throw "go orange"; callback("go grape"); },
	    asyncMethod2: function(callback) { setTimeout(callback.bind(this, "go banana"), 0); },
	    asyncMethod3: function(callback) { callback(new Error("go cucumber")); }
	};

	var emitter = duck.emitter(obj).punch('syncMethod');
	emitter.punch(['asyncMethod1', 'asyncMethod2', 'asyncMethod3'], 0);

	var runs = 0;

	emitter.on('before', function(args, self, method) {
		runs++;
		test.ok(true, "before ran");
	});

	emitter.on('after', function(result, args, self, method) {
		runs++;
		test.ok(true, "after ran");
		if(runs == totalRuns) test.done();
	});

	emitter.on('error', function(error, args, self, method) {
		runs++;
		test.ok(true, "error ran");
		if(runs == totalRuns) test.done();
	});

	process.on('uncaughtException', function(err) {
		runs++;
		test.ok(err == "go banana", "thrown banana went back up call stack correctly");
		if(runs == totalRuns) test.done();
	});

	try {
		obj.syncMethod();
	} catch(e) {
		runs++;
		test.ok(e == "go apple", "thrown apple caught in the expected portion of user code");
		if(runs == totalRuns) test.done();
	}
	try {
		obj.asyncMethod1(function() { test.ok(false, "will never run"); });
	} catch(e) {
		runs++;
		test.ok(e == "go orange", "thrown orange caught in the expected portion of user code");
		if(runs == totalRuns) test.done();
	}
	obj.asyncMethod2(function(fruit) { throw fruit; });
	obj.asyncMethod3(function(err, result) {
		runs++;
		if(err instanceof Error) test.ok(true, 'got the error object');
	});
};