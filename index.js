var Rsync = require("rsync");
var url = require("url");
var path = require("path");

function normalizePath(pathString){
	
	if(pathString[0] === "/") { // the absolute path
		return fis.util(pathString);
	} else { // the relative path
		return fis.util( fis.processCWD || process.cwd() +"/" + pathString );
	}
};


function sync(from, to, next){

	// config the args
	var rsync = new Rsync();
	rsync
		 .flags('rv')
		 .source(from)
		 .destination(to);
    
    // log start infos and print the shell command 
	fis.log.info(rsync.command());

	// run
    return rsync.execute(function(err, code, cmd){
    	/*callback*/
    	if(err) {
    		fis.log.error("[rsync error] "+ code + "|"+ cmd);
    	} else {
    		next && next();
    	}
    }, function(data){
    	/*stdout*/
    	// TODO: parse the info, log more friendly
    	fis.log.info(data.toString().replace(/\n/g, "\n\t").yellow.bold);
    }, function(data){
    	/*stderr*/
    	fis.log.error('[error]' + data.toString().red.bold);
    });
}

/**
 * deploy plugin , over rsync protocal, deploy files to remote servers
 * @param  {Object}   options  the options in fis-conf.js for this plugin
 * @param  {Array}   modified the modifed file list（for watch functions）
 * @param  {Array}   total    all the files
 * @param  {Function} next     call the next plugin's function
 * @return {undefined}
 */
module.exports = function(options, modified, total, next) {


	// if there is not a 'fis' in global, throw an error
	if(!fis) {
		throw new Error("this plugin only work with fis or tools based on fis");
	}

	if(!options || !options.from || !options.to) {
		throw new Error("this is no `from` or `to` args");
	}

	var modifiedLength = modified.length,
		totalLength = total.length;
	// sync mode: dir default。
	var syncMode = "dir";
	// if the modified files length is more than 10 or the percent is more than 50%, sync the dir, else sync the files
	if( modifiedLength > 10 || modifiedLength / totalLength > 0.5 ) {
		syncMode = "dir";
	} else {
		syncMode = "file";
	}

	fis.log.info( ("modified: "+ modifiedLength+"/ "+ totalLength+", use "+ syncMode + " mode" ).blue.bold );


	var rsyncPid = null;

	// the exit handler then the process has some singnal, or be killed
	var exit = function(){
		rsyncPid && rsyncPid.kill();
	};

	// listen to the events that notice us to exit
	process.on("SIGINT", exit);
	process.on("SIGTERM", exit);
	process.on("exit", exit);

	fis.log.info("rsync working……");

	var releaseOnlySub = !!options.from.match(/\/$/);

	if(syncMode == "dir") {
		rsyncPid = sync(normalizePath(options.from) + (releaseOnlySub ? "/":""), options.to, next);
	} else {
		
		modified.map(function(file){
			var release = file.getHashRelease();
			var to = path.join(options.to, (releaseOnlySub ? "" : path.basename(options.from)) , release);
			var from = normalizePath(options.from + release);

			return function(next){
				rsyncPid = sync(from, to, next);
			}
		}).reduceRight(function(next, current){
			return function(){
				current(next);
			};
		}, next)();
	}

}; 