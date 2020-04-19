//let mysql = require('mysql');
let AWS = require('aws-sdk');
let mysql2 = require('mysql2'); //https://www.npmjs.com/package/mysql2
let fs  = require('fs');

let connection;
let connectionConfig

exports.handler =  function(event, context, callback) {
console.log("Starting query ...\n");

        if(process.env['useIAM'] != 0){

            console.log("Entered normal connection if");

            connectionConfig = {
              host     : process.env['endpoint'],
              user     : process.env['user'],
              password : process.env['password'],
              database : process.env['my_db'],
              ssl: { rejectUnauthorized: false},
              connectTimeout:3000
              };

		}

    else {
       console.log("Running iam auth ...\n");

        //
        var signer = new AWS.RDS.Signer({
            region: 'us-east-1', // example: us-east-2
            hostname: 'test-database.proxy-ccsibpezv4qx.us-east-1.rds.amazonaws.com',
            port: 3306,
            username: 'admin'
        });

        let token = signer.getAuthToken({
          username: 'admin'
        });

        console.log ("IAM Token obtained\n");

        connectionConfig = {
          host: process.env['endpoint'], // Store your endpoint as an env var
          user: 'admin',
          database: process.env['my_db'], // Store your DB schema name as an env var
          ssl: { rejectUnauthorized: false},
          password: token,
          connectTimeout:3000,
          authSwitchHandler: function ({pluginName, pluginData}, cb) {
              console.log("Setting new auth handler.");
          }
        };

        // Adding the mysql_clear_password handler
        connectionConfig.authSwitchHandler = (data, cb) => {
            if (data.pluginName === 'mysql_clear_password') {
              // See https://dev.mysql.com/doc/internals/en/clear-text-authentication.html
              console.log("pluginName: "+data.pluginName);
              let password = token + '\0';
              let buffer = Buffer.from(password);
              cb(null, password);
            }
        };
      }
      
      
      

        connection = mysql2.createConnection(connectionConfig);
        connection.connect((err) => {
            if (err) {
                console.log('error connecting: ' + err.stack);
                return;
            }
            console.log('connected as id ' + connection.threadId + "\n");
         });


      connection.query("SELECT * FROM details", (error, results) => {
			if (error)
		  	throw error;
		  	
			if(results.length > 0){
			    console.log('yes');
				let result = results.rows;
				console.log(result);
				// var result = {
    //                     statusCode: 200,
    //                     body: results.rows
    //               };
    //           callback(error, result);
               connection.end();
            }

		});
		
		
// 				connection.end((error, results) => {
// 					  if(error){
// 					    return "error";

// 					  }
// 					  // The connection is terminated now
// 					  console.log("Connection ended\n");
					 

// 		});
};
