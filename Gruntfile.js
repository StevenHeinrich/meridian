module.exports = function (grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),
    	connect: {
    		server: {
    			options: {
	          		port: 3000,
	          		hostname:'localhost',
	          		keepalive: true,
	          		open:true
        		}//options
    		}//server
  		}//connect
	});

	grunt.loadNpmTasks('grunt-contrib-connect');	

  	grunt.registerTask('server', ['connect:server']);

};