
var parse = require('csv-parse');
var Promise = require("promise");

var $money = function(str){
	if(str =="-"){
		return 0; //convert - to 0
	}
	return parseInt(str.replace(/,/g,""),10) * 1000;
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

				var out = {
					name:null,
					year:null,
					subjects:[]
				};
				output.forEach(function(o){
					for(var i = 0 ; i < o.length ; ++i){
						o[i]= o[i].trim(); //避免後面寫一堆 trim
					}

					if(/中華民國[0-9]+年度/.test(o[13])){
						out.year_label = o[13];
						out.year = parseInt(o[13].match("[0-9]+")[0],10) + 1911;
					}

					if(/^[0-9]+$/.test(o[2])){ //有款
						last_sections[0] = parseInt(o[2],10);
						last_sections[1] = null;
						last_sections[2] = null;
						last_sections[3] = null;
					}
					if(/^[0-9]+$/.test(o[4])){ //有項
						last_sections[1] = parseInt(o[4],10);
						last_sections[2] = null;
						last_sections[3] = null;
					}
					if(/^[0-9]+$/.test(o[6])){ //有目
						last_sections[2] = parseInt(o[6],10);
						last_sections[3] = null;
					}
					if(/^[0-9]+$/.test(o[8])){ //有節
						last_sections[3] = parseInt(o[8],10);
					}

					if(o[12] != "" && o[12] !="本年度\n預算數"){ //有金額 // 假設有金額＝第四格一定是中文科目
						// console.log(o);
						if(last_subject != null && last_subject.section0 != 0){
							last_subject.comment = last_subject.comment.join("");
							out.subjects.push(last_subject);
						}
						last_subject_number = o[10].split(/[ \n]/)[0];
						last_subject = {
							section0:null,
							section1:null,
							section2:null,
							section3:null,
							section_string:null,
							number:last_subject_number,
							name:o[10].split(/[ \n]/)[1],
							year_this:null,
							year_last:null,
							year_compare_last:null,
							comment:[]
						};						
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

						last_subject.name = o[10].split(/[ \n]/)[1].trim();
						last_subject.year_this = $money(o[12]);
						last_subject.year_last = $money(o[15]);
						last_subject.year_last_two = $money(o[17]);
						last_subject.year_compare_last = $money(o[19]);
						// console.log(last_subject);
					}

					if(o[22] != "說　　明" && o[22] != ""){ //重要假設：除 header 外備註不會只有"說明" 兩字
						last_subject.comment.push(o[22]);
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