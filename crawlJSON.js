
var fs = require("fs");
var http = require('follow-redirects').http;
var request = require("request");

var download = function(url, dest) {

  return new Promise((ok,fail)=>{

    var file = fs.createWriteStream(dest);
    try{
        var request = http.get(url, function(response) {
          response.pipe(file);
          file.on("finish", function() {
            file.close(ok);  // close() is async, call cb after close completes.
          });
        }).on("error", function(err) { // Handle errors
          fs.unlink(dest); // Delete the file async. (But we don't check the result)
          if (ok) ok(err.message);
        });
    }catch(ex){
      ok();
    }
  });
 
};

var crawlAPI = function(node){
  return new Promise((ok,fail)=>{
    request("http://data.govapi.tw/node/"+node.id,function(err,req,data){
      var json = JSON.parse(data);
      ok(json.data);
    });
  });
};

var handleResource = function(r){
  console.log(r);

  var proms = [];
  if(r["資料資源"]){
    if (!fs.existsSync("files/"+r.id+"/"))
      fs.mkdirSync("files/"+r.id+"/",'0777', true);
    fs.writeFileSync("files/"+r.id+"/data.json", JSON.stringify(r));

    var urls = r["資料資源"];

    proms = urls.map(function(file,ind){
      var type ="";
      if(file.url.indexOf(".zip")!= -1){
        type = ".zip";
      }
      if(file.url.indexOf(".xls")!= -1){
        type = ".xls";
      }
      if(file.url.indexOf(".csv")!= -1){
        type = ".csv";
      }

      var filename = r.id+"_"+ind+type;

      if(filename[0] != "?"){
        filename = filename.split("?")[0];
      }
      if(filename == ""){
        return null;
      }

      console.log(r.id,filename);
      return download(file.url,"files/"+r.id+"/"+filename)
      .then(function(){
        console.log("download",r.id,index);
        return true;
      });
    });
  }
  return Promise.all(proms).then(function(){
    index++;
    return true;
  });
};

var records = JSON.parse(fs.readFileSync("./records_detail.json"));

var index = 0;
var n = 6;


var ary =[],results = [] ;

var batch = 5;
for(var i =0;i<records.length;i+=batch){
  ary.push(records.slice(i,i+batch));
}

var handleArys = function(ary,index){
  if(ary.length > index){
    return Promise.all(ary[index].map(handleResource)).then((datas)=>{
      console.log("handled",index);
      return handleArys(ary,index+1);
    });
  }else{
    return Promise.resolve(results);
  }
}

handleArys(ary,116);

