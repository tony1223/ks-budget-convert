
//this file used in 2017 !!

var parse = require("csv-parse");
var Promise = require("promise");

var $money = function(str){
  if(str =="-"){
    return 0; //convert - to 0
  }
  return parseInt(str.replace(/,/g,""),10);
};

var processCSV = function(err,body){
  var p = new Promise(function(ok,fail){
    var outputs = [];
    var out = {
      case_name:"中央總預算",
      name:"歲出機關別預算表",
      year:2017,
      subjects:[]
    };



    // {
    //   case_name:null,
    //   name:null,
    //  year:null,
    //   items:[
    //     // section1:null,
    //     // section2:null,
    //     // section3:null,
    //     // section4:null,
    //     // section_string:null,
    //     // number
    //     // name
    //     // year_this
    //     // year_last
    //     // year_compare_last
    //     // comment
    //   ];    
    // };

    var case_name = null;
    parse(body.toString(), null, function(err, output){
      try{
        // console.log(err);
        // console.log(output);
        /*
        plan: 
        1.標題
        2.'款', '項', '目', '節'
        3.名稱及編號
        4.金額
        5.備註

        重要假設：
        * 有金額＝第四格一定是中文科目
        */


        var last_sections = [null,null,null,null];
        var last_subject_number = null;
        var last_subject = null;

        var last_cat = null;
        var last2 = null;

        output.forEach(function(o){
          for(var i = 0 ; i < o.length ; ++i){
            o[i]= o[i].trim(); //避免後面寫一堆 trim
          }

          if(o[0] =="" && o[1] =="" && o[2]=="" && o[3] ==""){
            if(o[4]!="名稱及編號"){
              last_cat = o[4].split("\n")[1].trim();
            }
            return true;
          }


          if(/^[0-9]+$/.test(o[0])){ //有款
            last_sections[0] = parseInt(o[0],10);
            last_sections[1] = null;
            last_sections[2] = null;
            last_sections[3] = null;
          }
          
          if(/^[0-9]+$/.test(o[1])){ //有項
            last_sections[1] = parseInt(o[1],10);
            last_sections[2] = null;
            last_sections[3] = null;
          }

          if(/^[0-9]+$/.test(o[2])){ //有目
            last_sections[2] = parseInt(o[2],10);
            last_sections[3] = null;
          }

          if(/^[0-9]+$/.test(o[3])){ //有節
            last_sections[3] = parseInt(o[3],10);
          }

          if(/^.+/.test(o[4]) && o[4].indexOf("名稱及編號")==-1 && o[4] !="合計"){ //科目代碼 get //last subject_end
            if(last_subject != null && last_subject.section0 != 0){
              last_subject.comment = last_subject.comment.join("").replace(/\n/g,"");
              out.subjects.push(last_subject);
              // console.log("push subject",out);
            }
            last_subject_number = o[4].split("\n")[0].trim();
            last2 = last_subject;

            last_subject = {
              section0:null,
              section1:null,
              section2:null,
              section3:null,
              section_string:null,
              number:last_subject_number,
              name:null,
              year_this:null,
              year_last:null,
              category:last_cat,
              year_compare_last:null,
              comment:[]
            };
          }

          if(o[4] != "" && o[4].indexOf("名稱及編號")==-1 && o[4] !="合計"){ //有金額 // 假設有金額＝第四格一定是中文科目
            //這格很重要、把能填的填一填

            last_subject.section0 = last_sections[0];
            last_subject.section1 = last_sections[1];
            last_subject.section2 = last_sections[2];
            last_subject.section3 = last_sections[3];

            if(last_subject && last2 && last2.section3 == null 
                && last2.section2 != null 
                && last2.section2 != last_subject.section2){
              var obj = {};
              for(var k in last2){
                obj[k] = last2[k];
              }
              obj.section3 = 0 ;
              out.subjects.push(obj);
            }

            var tmpSections = [];
            for(var si = 0 ; si < last_sections.length;++si){
              if(last_sections[si]== null){
                break;
              }
              tmpSections.push(last_sections[si]);
            }
            last_subject.section_string = tmpSections.join("-");

            last_subject.name = o[4].trim().split("\n")[1].trim();
            last_subject.year_this = $money(o[5]) * 1000;
            last_subject.year_last = $money(o[6]) * 1000;
            last_subject.year_compare_last = $money(o[7]) * 1000;
            last_subject.comment.push(o[8].replace(/[\n\r] +/g,"").trim());
            // console.log(last_subject);
          }

          // console.log(last_sections);

        });
        if(out.year != null){ //not a empty out
          if(last_subject != null && last_subject.section0 != 0){
            last_subject.comment = last_subject.comment.join("").replace(/\n/g,"");;
            out.subjects.push(last_subject);
          }
          outputs.push(out);
        }
        // console.log(JSON.stringify(outputs));
        ok(outputs);
      }catch(ex){
        console.log(ex,ex.stack);
      }
      // console.log(output);
    });
  });
  return p;
};

module.exports = processCSV;
