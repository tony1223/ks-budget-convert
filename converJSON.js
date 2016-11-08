
var fs = require("fs");
var http = require("http");
var request = require("request");

var crawlAPI = function(node){
  return new Promise((ok,fail)=>{
    request("http://data.govapi.tw/node/"+node.id,function(err,req,data){
      var json = JSON.parse(data);
      ok(json.data);
    });
  });
};

var records = JSON.parse(fs.readFileSync("./records.json")).Record;


var ary =[],results = [] ;

for(var i =0;i<records.length;i+=15){
  ary.push(records.slice(i,i+15));
}

var handleArys = function(ary,index){
  if(ary.length > index){
    return Promise.all(ary[index].map(crawlAPI)).then((datas)=>{
      console.log("handled",index);
      datas.forEach((d)=>{ results.push(d); });
      return handleArys(ary,index+1);
    });
  }else{
    return Promise.resolve(results);
  }
}

handleArys(ary,0).then((res)=>{
  console.log("handled_result",res);
  fs.writeFileSync("./records_detail.json", JSON.stringify(res));
});