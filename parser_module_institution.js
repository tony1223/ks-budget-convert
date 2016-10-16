

//this file used in 2016 !!


var parse = require('csv-parse');
var Promise = require("promise");

var $money = function(str){
	if(str =="-"){
		return 0; //convert - to 0
	}
	return parseInt(str.replace(/,/g,""),10);
}

var processCSV = function(err,body){
	var p = new Promise(function(ok,fail){
		var outputs = [];
		var out = null;

		// {
		// 	case_name:null,
		// 	name:null,
		//	year:null,
		// 	items:[
		// 		// section1:null,
		// 		// section2:null,
		// 		// section3:null,
		// 		// section4:null,
		// 		// section_string:null,
		// 		// number
		// 		// name
		// 		// year_this
		// 		// year_last
		// 		// year_compare_last
		// 		// comment
		// 	];		
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


				output.forEach(function(o){
					for(var i = 0 ; i < o.length ; ++i){
						o[i]= o[i].trim(); //避免後面寫一堆 trim
					}

					if(o[0] && o[0].indexOf("總預算") != -1){ //大標
						case_name = o[0];
					}
					if(o[0] && o[0].indexOf("預算表") != -1){ //大標
						if( out == null){	//第一次
							out = {
								case_name:case_name,
								name:o[0],
								year:null,
								subjects:[]
							};

						}else if(out.name != o[0]){ //非同一預算表底下
							outputs.push(out);
							out = {
								case_name:case_name,
								name:o[0],
								year:null,
								subjects:[
								]
							};

						}else{ //同一預算表，跳過

						}
					}


					if(/中華民國[0-9]+年度/.test(o[7])){
						out.year_label = o[7];
						out.year = parseInt(o[7].match("[0-9]+")[0],10) + 1911;
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

					if(/^[0-9]+/.test(o[4] || o[5])){ //科目代碼 get //last subject_end
						if(last_subject != null && last_subject.section0 != 0){
							last_subject.comment = last_subject.comment.join("");
							out.subjects.push(last_subject);
							// console.log("push subject",out);
						}
						last_subject_number = o[4] || o[5];
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
							year_compare_last:null,
							comment:[]
						};
					}

					if(o[6] != "" && o[6] !='名 稱 及 編 號' && o[6] !="本年度預算數"){ //有金額 // 假設有金額＝第四格一定是中文科目
						// console.log(o);
						//這格很重要、把能填的填一填
						last_subject.section0 = last_sections[0];
						last_subject.section1 = last_sections[1];
						last_subject.section2 = last_sections[2];
						last_subject.section3 = last_sections[3];

						var tmpSections = [];
						for(var si = 0 ; si < last_sections.length;++si){
							if(last_sections[si]== null){
								break;
							}
							tmpSections.push(last_sections[si]);
						}
						last_subject.section_string = tmpSections.join("-");

						last_subject.name = o[6].trim();
						last_subject.year_this = $money(o[7]) * 1000;
						last_subject.year_last = $money(o[8]) * 1000;
						last_subject.year_compare_last = $money(o[9]) * 1000;
						last_subject.comment.push(o[10]);
						// console.log(last_subject);
					}

					// console.log(last_sections);

				});
				if(out.year != null){ //not a empty out
					if(last_subject != null && last_subject.section0 != 0){
						last_subject.comment = last_subject.comment.join("");
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
	return p
};

module.exports = processCSV;
