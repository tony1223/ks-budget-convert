
var fs = require("fs");
var cheerio = require("cheerio");
var units = require("./units.json");
var optypes = require("./optypes.json");

var unitmap = units.map((now,next)=>{
  now[next["代碼"]] = next["名稱"];
  return now;
},{});

var opmap = optypes.map((now,next)=>{
  now[next["代碼"]] = next["名稱"];
  return now;
},{});


var parseBudgetNo = function(budgetno){
  var groups = [
    budgetno.substring(0,2), //政事
    budgetno.substring(2,4), //主管 款
    budgetno.substring(4,6), //機關 項
    budgetno.substring(6,8), //目
    budgetno.substring(8,10) //節
  ];
  var steps = 0;
  if(groups[1] != "00"){
    steps++;
  }
  if(groups[2] != "00"){
    steps++;
  }
  if(groups[3] != "00"){
    steps++;
  }
  if(groups[4] != "00"){
    steps++;
  }

  var hasGroup = groups[0] != "00";
  var all_steps = [groups[1],groups[2],groups[3],groups[4]];
  return {
    steps:all_steps,
    step_index:steps,
    unit_name:unitmap[groups[1]+groups[2]],
    op_name:opmap[groups[0]],
    name:groups[3]+groups[4],
    exist_steps:all_steps.slice(0,steps),
    category:groups[0],
    hasGroup,
    no:budgetno
  };
};

var processMemoData = function(xml){
  var $ = cheerio.load(xml, {xmlMode: true});
  var result = [];
  $("BCTDMEMO_row").each(function(ind,item){
    // console.log(item);
    var text = $(item).find("bc_key").text().substring(0,13);
    
    text = text.substring(0,4) + text.substring(5);

    result.push({
      key:text,
      text:$(item).find("bc_content").text()
    });
  });

  return result;
};

var parse = function( body ){
  var $ = cheerio.load(body, {xmlMode: true});
  var items = [];

  var memoData = processMemoData(body);
  $("BCTDBUDGETDETAIL_row").each(function(ind,item){
    var text = $(item).find("ba_budgetno").text();
    text = text.substring(0,4) + text.substring(5);
    if(!text){
      return true;
    }

    var budget = parseBudgetNo(text);
    var subno = $(item).find("ba_subprojectno").text();

    items.push({
      code:text,
      series:budget,
      amount:$(item).find("ba_budgetamt").text(),
      last_amount:$(item).find("ba_budgetamt").text(),
      name:budget.name,
      comment: memoData.filter((r)=> r.key == budget.no+subno)
        .map(r=> r.text).join("\n=====\n")
    });
  });

  items = items.filter(function(item){
    return !(item.series.step_index == 2 && item.series.hasGroup);
  });

  var buildSeriesMap = function(items){
    var seriesMap = items.filter( it => it.series.step_index <= 3).reduce(function(now,next){
      var series = next.series;
      now[series.exist_steps.join("")] = {
        name:next.name,
        count:0
      };
      return now;
    },{});

    items.filter( it => it.series.step_index ==4).forEach(function(item){
      var series = item.series;
      // seriesMap[series.exist_steps.slice(0,series.step_index-1).join("")].count++;
    });
    return seriesMap;
  };


  var out = [];
  // var seriesMap = buildSeriesMap(items);
  items.forEach(function(item){
    var series = item.series;

    // if(series.step_index == 3 && seriesMap[series.exist_steps.join("")].count > 0){
      // return true;
    // }


    // var names = [];
    // for(var i = 1; i <= 3;++i){
    //   if(i==1 && seriesMap[item.series.exist_steps.slice(0,i).join("")]== null){
    //     names.push(seriesMap[item.series.exist_steps.slice(0,i+1).join("")].name);
    //   }else{
    //     names.push(seriesMap[item.series.exist_steps.slice(0,i).join("")].name);
    //   }
    // }      

    out.push( {
      code:item.code,
      amount:parseInt(item.amount,10),
      last_amount:parseInt(item.last_amount,10),
      name:item.name,
      comment:item.comment,
      topname:item.unit_name,
      depname:item.unit_name,
      category:item.unit_name,
      depcat:item.unit_name,
          //no more data , so ...
      cat:item.unit_name,
      ref:item.code
    });
  });
  return out;

};


var module = parse(fs.readFileSync(process.argv[2]));
console.log(JSON.stringify(module));

